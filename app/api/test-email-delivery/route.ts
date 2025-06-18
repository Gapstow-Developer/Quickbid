import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("🧪 Email delivery test started")

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 })
    }

    console.log(`📧 Testing email delivery to: ${email}`)

    // Create a simple test email
    const testEmailData = {
      to: email,
      subject: "Window Cleaning Calculator - Email Delivery Test",
      text: `
Hello,

This is a test email from the Window Cleaning Calculator to verify email delivery.

If you're receiving this email, it means our system can successfully deliver emails to your address.

Timestamp: ${new Date().toISOString()}
Test ID: ${Math.random().toString(36).substring(7)}

Thank you for testing our system!

---
Westlake Window Cleaners
13477 Prospect Rd. Strongsville, OH 44149
      `.trim(),
      replyTo: "info@westlakewindowcleaners.com",
    }

    // Send test email via SendGrid
    const response = await fetch(new URL("/api/sendgrid", request.url).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testEmailData),
    })

    const result = await response.json()

    console.log("📨 Email delivery test response:", {
      status: response.status,
      ok: response.ok,
      result,
    })

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Email delivery test failed",
          status: response.status,
          details: result,
        },
        { status: response.status },
      )
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${email}`,
      messageId: result.messageId,
      details: {
        email,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error("💥 Email delivery test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Email delivery test failed: ${error.message}`,
        details: error.stack,
      },
      { status: 500 },
    )
  }
}
