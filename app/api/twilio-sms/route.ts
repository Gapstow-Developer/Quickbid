import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("📱 Twilio SMS API route called")

  try {
    const { to, message } = await request.json()

    if (!to || !message) {
      return NextResponse.json({ error: "Phone number and message are required" }, { status: 400 })
    }

    // Twilio credentials (you'd need to sign up for Twilio)
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER // Your Twilio phone number

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Twilio credentials not configured",
          needsSetup: true,
        },
        { status: 401 },
      )
    }

    // Send SMS via Twilio API
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: to,
        Body: message,
      }),
    })

    if (response.ok) {
      const result = await response.json()
      console.log("✅ SMS sent successfully via Twilio!")

      return NextResponse.json({
        success: true,
        messageId: result.sid,
        message: "SMS sent successfully via Twilio",
      })
    } else {
      const errorText = await response.text()
      console.error("❌ Twilio error:", errorText)

      return NextResponse.json(
        {
          success: false,
          error: `Twilio error: ${errorText}`,
        },
        { status: response.status },
      )
    }
  } catch (error: any) {
    console.error("💥 Unexpected error in Twilio SMS API:", error)

    return NextResponse.json(
      {
        success: false,
        error: `Twilio SMS error: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
