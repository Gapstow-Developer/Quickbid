import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { id } = params

    const { data, error } = await supabase.from("services").select("*").eq("id", id).single()

    if (error) {
      console.error("Service fetch error:", error)
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to fetch service",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error("Error fetching service:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch service",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { id } = params
    const data = await request.json()

    const { error } = await supabase
      .from("services")
      .update({
        name: data.name,
        description: data.description || null,
        category: data.category,
        per_sqft_price: data.per_sqft_price || null,
        flat_fee: data.flat_fee || null,
        use_both_pricing: data.use_both_pricing || false,
        minimum_price: data.minimum_price || null,
        is_active: data.is_active !== undefined ? data.is_active : true,
        display_order: data.display_order || 0,
      })
      .eq("id", id)

    if (error) {
      console.error("Service update error:", error)
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to update service",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Service updated successfully",
    })
  } catch (error: any) {
    console.error("Error updating service:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update service",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { id } = params
    const data = await request.json()

    const { error } = await supabase.from("services").update(data).eq("id", id)

    if (error) {
      console.error("Service patch error:", error)
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to update service",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Service updated successfully",
    })
  } catch (error: any) {
    console.error("Error updating service:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update service",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { id } = params

    const { error } = await supabase.from("services").delete().eq("id", id)

    if (error) {
      console.error("Service delete error:", error)
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to delete service",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Service deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting service:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete service",
      },
      { status: 500 },
    )
  }
}
