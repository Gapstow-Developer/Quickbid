import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

// Force this route to always be dynamic and not cached
export const revalidate = 0

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Get total revenue from submitted quotes
    const { data: quotes, error: quotesError } = await supabase
      .from("quotes")
      .select("final_price")
      .eq("status", "submitted")

    if (quotesError) {
      throw quotesError
    }

    const totalRevenue = quotes?.reduce((sum, quote) => sum + (quote.final_price || 0), 0) || 0

    // Get total quotes count
    const { count: totalQuotes, error: totalError } = await supabase
      .from("quotes")
      .select("*", { count: "exact", head: true })
      .eq("status", "submitted")

    if (totalError) {
      throw totalError
    }

    // Get incomplete quotes count
    const { count: incompleteQuotes, error: incompleteError } = await supabase
      .from("quotes")
      .select("*", { count: "exact", head: true })
      .eq("status", "incomplete")

    if (incompleteError) {
      throw incompleteError
    }

    // Calculate conversion rate
    const totalForms = (totalQuotes || 0) + (incompleteQuotes || 0)
    const conversionRate = totalForms > 0 ? Math.round(((totalQuotes || 0) / totalForms) * 100) : 0

    return NextResponse.json({
      totalRevenue,
      totalQuotes: totalQuotes || 0,
      incompleteQuotes: incompleteQuotes || 0,
      conversionRate,
    })
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
