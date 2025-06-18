import { type NextRequest, NextResponse } from "next/server"
import sgMail from "@sendgrid/mail"

export async function POST(request: NextRequest) {
  try {
    const { to, subject, text, html, replyTo } = await request.json()

    if (!process.env.SENDGRID_API_KEY) {
      console.error("❌ SENDGRID_API_KEY is not set.")
      return NextResponse.json({ success: false, error: "SendGrid API key is not configured." }, { status: 500 })
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY)

    // Ensure the 'from' email is a verified sender in your SendGrid account.
    // Replace 'info@westlakewindowcleaners.com' with your actual verified sender email.
    const fromEmail = "info@westlakewindowcleaners.com"

    const msg = {
      to,
      from: fromEmail, // This must be a verified sender in SendGrid
      subject,
      text,
      html,
      replyTo: replyTo || fromEmail, // Set reply-to, defaults to fromEmail
    }

    console.log("Attempting to send email via SendGrid:", {
      to: msg.to,
      from: msg.from,
      subject: msg.subject,
      replyTo: msg.replyTo,
      htmlContentLength: msg.html?.length,
      textContentLength: msg.text?.length,
    })

    const [response] = await sgMail.send(msg)

    console.log("SendGrid API Response Status:", response.statusCode)
    console.log("SendGrid API Response Headers:", response.headers)

    if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
      console.log("✅ Email sent successfully via SendGrid. Message ID:", response.headers["x-message-id"])
      return NextResponse.json({
        success: true,
        message: "Email sent successfully",
        messageId: response.headers["x-message-id"],
      })
    } else {
      // Log detailed error response from SendGrid
      const errorBody = await new Response(response.body).json()
      console.error("❌ SendGrid email sending failed with status:", response.statusCode)
      console.error("❌ SendGrid error details:", errorBody)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send email via SendGrid",
          details: errorBody,
          statusCode: response.statusCode,
        },
        { status: response.statusCode || 500 },
      )
    }
  } catch (error: any) {
    console.error("❌ Error in SendGrid route:", error)
    // Log specific error properties if available
    if (error.response) {
      console.error("SendGrid API Error Response Body:", error.response.body)
      console.error("SendGrid API Error Response Headers:", error.response.headers)
    }
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}
