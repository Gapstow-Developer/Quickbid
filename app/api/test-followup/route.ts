import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("🧪 Testing follow-up email system...")

    const supabase = createServerSupabaseClient()

    // Get the most recent incomplete quote for testing
    const { data: testQuote, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("status", "incomplete")
      .not("customer_email", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error || !testQuote) {
      return NextResponse.json({
        success: false,
        message: "No incomplete quotes found for testing",
        error: error?.message,
      })
    }

    console.log("📧 Testing with quote:", testQuote.id, testQuote.customer_name)

    // Prepare quote data
    const quoteData = {
      customerName: testQuote.customer_name,
      customerEmail: testQuote.customer_email,
      customerPhone: testQuote.customer_phone,
      address: testQuote.address,
      serviceType: testQuote.service_type,
      stories: testQuote.stories,
      squareFootage: testQuote.square_footage,
      addons: testQuote.addons || [],
      hasSkylights: testQuote.has_skylights,
      additionalServices: testQuote.additional_services || {},
      finalPrice: testQuote.final_price,
      lastStepCompleted: testQuote.last_step_completed,
    }

    // Test the follow-up email directly
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

    const emailResponse = await fetch(`${baseUrl}/api/send-followup-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quoteData }),
    })

    const emailResult = await emailResponse.json()

    return NextResponse.json({
      success: emailResult.success,
      message: emailResult.success ? "Test follow-up email sent!" : "Failed to send test email",
      quoteId: testQuote.id,
      customerEmail: testQuote.customer_email,
      emailResult,
    })
  } catch (error: any) {
    console.error("❌ Test follow-up error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Test failed",
      },
      { status: 500 },
    )
  }
}
