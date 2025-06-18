import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

// Force dynamic rendering and disable caching for this route
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    const { data: services, error } = await supabase
      .from("services")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Services fetch error:", error)
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to fetch services",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: services || [],
    })
  } catch (error: any) {
    console.error("Error fetching services:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch services",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const data = await request.json()

    // Get the highest display_order to place new service at the end
    const { data: lastService } = await supabase
      .from("services")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)
      .single()

    const displayOrder = lastService ? lastService.display_order + 10 : 10

    const { data: newService, error } = await supabase
      .from("services")
      .insert({
        name: data.name,
        description: data.description || null,
        category: data.category,
        per_sqft_price: data.per_sqft_price || null,
        flat_fee: data.flat_fee || null,
        use_both_pricing: data.use_both_pricing !== undefined ? data.use_both_pricing : false,
        minimum_price: data.minimum_price || null,
        is_active: data.is_active !== undefined ? data.is_active : true,
        display_order: displayOrder,
      })
      .select()
      .single()

    if (error) {
      console.error("Service creation error:", error)
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to create service",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: newService,
      message: "Service created successfully",
    })
  } catch (error: any) {
    console.error("Error creating service:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create service",
      },
      { status: 500 },
    )
  }
}
