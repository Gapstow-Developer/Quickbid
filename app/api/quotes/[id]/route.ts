import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const data = await request.json()
    const { id } = params

    console.log(`📝 Updating quote ${id}:`, data)

    const { data: updatedQuote, error } = await supabase
      .from("quotes")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("❌ Error updating quote:", error)
      throw new Error(`Failed to update quote: ${error.message}`)
    }

    console.log("✅ Quote updated successfully:", updatedQuote.id)

    return NextResponse.json({
      success: true,
      message: "Quote updated successfully",
      data: updatedQuote,
    })
  } catch (error: any) {
    console.error("❌ Quote update error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update quote",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { id } = params

    console.log(`🗑️ Deleting quote ${id}`)

    const { error } = await supabase.from("quotes").delete().eq("id", id)

    if (error) {
      console.error("❌ Error deleting quote:", error)
      throw new Error(`Failed to delete quote: ${error.message}`)
    }

    console.log("✅ Quote deleted successfully")

    return NextResponse.json({
      success: true,
      message: "Quote deleted successfully",
    })
  } catch (error: any) {
    console.error("❌ Quote delete error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete quote",
      },
      { status: 500 },
    )
  }
}
