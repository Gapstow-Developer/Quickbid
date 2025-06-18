import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    console.log("📝 Quote API called")

    const supabase = createServerSupabaseClient()
    const data = await request.json()

    console.log("📝 Quote data received:", {
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      service_type: data.service_type,
      addons: data.addons,
      status: data.status,
      final_price: data.final_price,
      last_step_completed: data.last_step_completed,
    })

    // Test database connection first
    const { data: testConnection, error: connectionError } = await supabase.from("quotes").select("count").limit(1)

    if (connectionError) {
      console.error("❌ Database connection failed:", connectionError)
      throw new Error(`Database connection failed: ${connectionError.message}`)
    }

    console.log("✅ Database connection successful")

    // Prepare the quote data with correct data types
    const quoteData = {
      customer_name: data.customer_name || "Unknown",
      customer_email: data.customer_email || "unknown@example.com",
      customer_phone: data.customer_phone || "",
      address: data.address || "",
      square_footage: data.square_footage ? Number.parseInt(data.square_footage.toString()) : 0,
      stories: data.stories ? Number.parseInt(data.stories.toString()) : 1,
      service_type: data.service_type || "exterior-only",
      addons: Array.isArray(data.addons) ? data.addons : [],
      final_price: data.final_price ? Number.parseFloat(data.final_price.toString()) : 0,
      status: "submitted", // Force this to be submitted
      last_step_completed: 4, // Force this to be 4 for completed quotes
      has_skylights: Boolean(data.has_skylights),
      additional_services: data.additional_services || {},
      quote_data: data.quote_data || data,
      distance: data.distance ? Number.parseFloat(data.distance.toString()) : null,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("📝 Prepared quote data:", {
      ...quoteData,
      quote_data: "... (truncated for logging)",
    })

    // Create new submitted quote
    console.log("➕ Creating new submitted quote...")

    const { data: newQuote, error } = await supabase.from("quotes").insert(quoteData).select().single()

    if (error) {
      console.error("❌ Database insert error:", error)
      console.error("❌ Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      throw new Error(`Database error: ${error.message}`)
    }

    console.log("✅ Quote created successfully:", newQuote.id)

    // After successful quote creation, clean up incomplete quote
    if (data.existing_quote_id) {
      try {
        console.log("🗑️ Cleaning up incomplete quote:", data.existing_quote_id)
        const { error: deleteError } = await supabase
          .from("quotes")
          .delete()
          .eq("id", data.existing_quote_id)
          .eq("status", "incomplete")

        if (deleteError) {
          console.error("❌ Error cleaning up incomplete quote:", deleteError)
        } else {
          console.log(`✅ Cleaned up incomplete quote: ${data.existing_quote_id}`)
        }
      } catch (cleanupError) {
        console.error("❌ Error during cleanup:", cleanupError)
        // Don't fail the main submission
      }
    }

    return NextResponse.json({
      success: true,
      message: "Quote saved successfully",
      id: newQuote.id,
      data: newQuote,
      action: "created",
    })
  } catch (error: any) {
    console.error("❌ Quote API error:", error)

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save quote",
        error: error.toString(),
      },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get("status")

    let query = supabase.from("quotes").select("*")

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter)
    }

    const { data: quotes, error } = await query.order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch quotes: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      data: quotes || [],
    })
  } catch (error: any) {
    console.error("Error fetching quotes:", error)

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch quotes",
      },
      { status: 500 },
    )
  }
}
