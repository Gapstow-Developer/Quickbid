import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { quoteData } = await request.json()

    console.log("📧 Sending follow-up email for:", quoteData.customerName)

    if (!quoteData.customerEmail || !quoteData.customerName) {
      throw new Error("Missing customer email or name")
    }

    // Get settings for business info
    const settingsResponse = await fetch(
      new URL("/api/settings", process.env.NEXTAUTH_URL || "http://localhost:3000").toString(),
    )
    const settings = settingsResponse.ok ? await settingsResponse.json() : {}

    const businessName = settings.businessName || "Window Cleaning Service"
    const businessPhone = settings.businessPhone || "(555) 123-4567"
    const businessEmail = settings.businessEmail || "info@windowcleaning.com"

    // Create follow-up email content
    const subject = `${quoteData.customerName}, how can we win your business?`

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Hi ${quoteData.customerName},</h2>
        
        <p>I noticed you started getting a quote for window cleaning services but didn't complete the process. I'd love to help you get the best service possible!</p>
        
        ${
          quoteData.finalPrice
            ? `
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #374151;">Your Quote Summary:</h3>
            <p style="margin: 5px 0;"><strong>Service:</strong> ${quoteData.serviceType}</p>
            <p style="margin: 5px 0;"><strong>Address:</strong> ${quoteData.address}</p>
            ${quoteData.squareFootage ? `<p style="margin: 5px 0;"><strong>Square Footage:</strong> ${quoteData.squareFootage} sq ft</p>` : ""}
            <p style="margin: 5px 0; font-size: 18px; color: #059669;"><strong>Estimated Price: $${quoteData.finalPrice}</strong></p>
          </div>
        `
            : ""
        }
        
        <h3 style="color: #374151;">Why Choose ${businessName}?</h3>
        <ul style="color: #6b7280;">
          <li>✅ Fully insured and bonded</li>
          <li>✅ 100% satisfaction guarantee</li>
          <li>✅ Competitive pricing with no hidden fees</li>
          <li>✅ Professional, reliable service</li>
          <li>✅ Free estimates</li>
        </ul>
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #92400e;">🎉 Special Offer Just for You!</h3>
          <p style="margin: 0; color: #92400e;"><strong>Get 10% off your first service</strong> when you book within the next 48 hours!</p>
        </div>
        
        <h3 style="color: #374151;">Common Questions We Get:</h3>
        <div style="color: #6b7280;">
          <p><strong>Q: Is the price competitive?</strong><br>
          A: We offer fair, transparent pricing with no surprises. Many customers find we're actually less expensive than competitors when you factor in our quality and reliability.</p>
          
          <p><strong>Q: Are you insured?</strong><br>
          A: Absolutely! We carry full liability insurance and are bonded for your peace of mind.</p>
          
          <p><strong>Q: What if I'm not satisfied?</strong><br>
          A: We guarantee your satisfaction. If you're not happy, we'll make it right or refund your money.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 18px; color: #374151;"><strong>Ready to get started?</strong></p>
          <p style="color: #6b7280;">Reply to this email or call us at <strong>${businessPhone}</strong></p>
          <p style="color: #6b7280;">We're here to answer any questions and earn your business!</p>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #9ca3af; font-size: 14px;">
          <p>${businessName}<br>
          ${businessPhone} | ${businessEmail}</p>
        </div>
      </div>
    `

    // Send email using SendGrid
    const emailResponse = await fetch(
      new URL("/api/sendgrid", process.env.NEXTAUTH_URL || "http://localhost:3000").toString(),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: quoteData.customerEmail,
          subject: subject,
          html: emailContent,
        }),
      },
    )

    const emailResult = await emailResponse.json()

    if (!emailResult.success) {
      console.error("❌ SendGrid error:", emailResult.error)
      throw new Error(`Email sending failed: ${emailResult.error}`)
    }

    console.log("✅ Follow-up email sent successfully to:", quoteData.customerEmail)

    return NextResponse.json({
      success: true,
      message: "Follow-up email sent successfully",
    })
  } catch (error: any) {
    console.error("❌ Error sending follow-up email:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send follow-up email",
      },
      { status: 500 },
    )
  }
}
