import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("Testing customer email delivery")

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 })
    }

    console.log(`Testing email delivery to: ${email}`)

    // Create a simple test email
    const testEmailData = {
      to: email,
      subject: "Test Email - Westlake Window Cleaners",
      text: `Hello,

This is a test email to verify that our system can deliver emails to your address.

If you receive this email, our email system is working correctly.

Test Details:
- Timestamp: ${new Date().toISOString()}
- Test ID: ${Math.random().toString(36).substring(7)}

Best regards,
Westlake Window Cleaners
13477 Prospect Rd. Strongsville, OH 44149`,
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

    console.log("Test email response:", {
      status: response.status,
      ok: response.ok,
      success: result.success,
      error: result.error,
    })

    if (!response.ok || !result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Test email delivery failed",
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
    console.error("Test email delivery failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Test email delivery failed: ${error.message}`,
        details: error.stack,
      },
      { status: 500 },
    )
  }
}
