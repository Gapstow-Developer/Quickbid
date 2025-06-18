import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

// Use a fixed UUID for the single settings row
const SETTINGS_ID = "00000000-0000-0000-0000-000000000001"

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()

    console.log("=== SETTINGS UPDATE API CALLED ===")
    console.log("Request body received:", body)
    console.log("Discount type in request:", body.discount_type)

    // Validate discount percentage
    if (body.discount_percentage !== undefined) {
      const discountPercentage = Number.parseInt(body.discount_percentage)
      if (isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 50) {
        return NextResponse.json(
          {
            success: false,
            message: "Discount percentage must be between 0 and 50",
          },
          { status: 400 },
        )
      }
      body.discount_percentage = discountPercentage
    }

    // Validate discount type
    if (body.discount_type !== undefined) {
      if (!["actual", "visual_only"].includes(body.discount_type)) {
        return NextResponse.json(
          {
            success: false,
            message: "Discount type must be either 'actual' or 'visual_only'",
          },
          { status: 400 },
        )
      }
    }

    // Validate post_construction_markup_percentage
    if (body.post_construction_markup_percentage !== undefined) {
      const markupPercentage = Number.parseFloat(body.post_construction_markup_percentage)
      if (isNaN(markupPercentage) || markupPercentage < 0 || markupPercentage > 100) {
        return NextResponse.json(
          {
            success: false,
            message: "Post-construction markup percentage must be between 0 and 100",
          },
          { status: 400 },
        )
      }
      body.post_construction_markup_percentage = markupPercentage
    }

    // First, let's check what's currently in the database
    console.log("Checking current database state...")
    const { data: currentData, error: fetchError } = await supabase
      .from("settings")
      .select("*")
      .eq("id", SETTINGS_ID)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching current settings:", fetchError)
    } else {
      console.log("Current settings in database:", currentData)
      console.log("Current discount_type in database:", currentData?.discount_type)
    }

    // Prepare data for upsert
    const updateData = {
      id: SETTINGS_ID,
      ...body,
      updated_at: new Date().toISOString(),
    }

    console.log("Data being upserted:", updateData)
    console.log("Discount type being saved:", updateData.discount_type)

    // Upsert settings
    const { data, error } = await supabase.from("settings").upsert(updateData, { onConflict: "id" }).select()

    if (error) {
      console.error("Error during upsert:", error)
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to update settings",
        },
        { status: 500 },
      )
    }

    console.log("Upsert successful, returned data:", data)
    console.log("Discount type in returned data:", data[0]?.discount_type)

    // Immediately verify the save by fetching the data again
    console.log("Verifying save by fetching data again...")
    const { data: verifyData, error: verifyError } = await supabase
      .from("settings")
      .select("*")
      .eq("id", SETTINGS_ID)
      .single()

    if (verifyError) {
      console.error("Error verifying save:", verifyError)
    } else {
      console.log("Verification fetch result:", verifyData)
      console.log("Verified discount_type:", verifyData.discount_type)
    }

    return NextResponse.json({
      success: true,
      data: data[0],
    })
  } catch (error: any) {
    console.error("Error in settings update API:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update settings",
      },
      { status: 500 },
    )
  }
}
