import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Get quotes data for the last 12 months
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const { data: quotes, error } = await supabase
      .from("quotes")
      .select("created_at")
      .gte("created_at", twelveMonthsAgo.toISOString())
      .eq("status", "submitted")

    if (error) {
      throw error
    }

    // Group quotes by month
    const monthlyData: { [key: string]: number } = {}
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // Initialize all months with 0
    months.forEach((month) => {
      monthlyData[month] = 0
    })

    // Count quotes by month
    quotes?.forEach((quote) => {
      const date = new Date(quote.created_at)
      const monthName = months[date.getMonth()]
      monthlyData[monthName]++
    })

    // Convert to chart format
    const chartData = months.map((month) => ({
      name: month,
      total: monthlyData[month],
    }))

    return NextResponse.json(chartData)
  } catch (error: any) {
    console.error("Error fetching overview data:", error)
    return NextResponse.json({ error: "Failed to fetch overview data" }, { status: 500 })
  }
}
