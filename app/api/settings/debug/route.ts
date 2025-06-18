import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    console.log("=== DEBUG API CALLED ===")

    // Get all settings rows to see what's in the table
    const { data: allData, error: allError } = await supabase.from("settings").select("*")

    console.log("All settings rows:", allData)
    console.log("Error fetching all:", allError)

    // Get the specific settings row
    const { data: specificData, error: specificError } = await supabase
      .from("settings")
      .select("*")
      .eq("id", SETTINGS_ID)
      .single()

    console.log("Specific settings row:", specificData)
    console.log("Error fetching specific:", specificError)

    return NextResponse.json({
      success: true,
      allRows: allData,
      specificRow: specificData,
      errors: {
        all: allError,
        specific: specificError,
      },
    })
  } catch (error: any) {
    console.error("Error in debug API:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    )
  }
}
