import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001"

export async function GET() {
  const { userId } = auth()
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("settings").select("*").eq("id", SETTINGS_ID).single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching settings:", error)
      return NextResponse.json({ message: "Failed to fetch settings" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in settings GET API:", error)
    return NextResponse.json({ message: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { userId } = auth()
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const supabase = createServerSupabaseClient()
    const settingsData = await request.json()

    const { data, error } = await supabase
      .from("settings")
      .upsert({ ...settingsData, id: SETTINGS_ID })
      .select()
      .single()

    if (error) {
      console.error("Error updating settings:", error)
      return NextResponse.json({ message: "Failed to update settings" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error in settings POST:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
