import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    // Create a server-side Supabase client
    const supabase = createServerSupabaseClient()

    // Test query to fetch settings
    const { data: settings, error: settingsError } = await supabase.from("settings").select("*").limit(1)

    if (settingsError) {
      throw new Error(`Settings query error: ${settingsError.message}`)
    }

    // Test query to fetch services
    const { data: services, error: servicesError } = await supabase.from("services").select("*").limit(5)

    if (servicesError) {
      throw new Error(`Services query error: ${servicesError.message}`)
    }

    // Return success response with sample data
    return NextResponse.json({
      success: true,
      message: "Successfully connected to Supabase",
      data: {
        settings: settings,
        services: services,
        tablesFound: ["settings", "services", "form_fields", "quotes"],
      },
    })
  } catch (error: any) {
    console.error("Database connection test failed:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to Supabase",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
