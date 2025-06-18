import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { quoteData, isTest } = await request.json()

    if (!quoteData) {
      return NextResponse.json({ error: "Quote data is required" }, { status: 400 })
    }

    console.log(`${isTest ? "TEST - " : ""}Processing email for quote: $${quoteData.finalPrice}`)

    // Format email content
    const emailContent = formatEmailContent(quoteData, isTest)
    const subject = `${isTest ? "[TEST] " : ""}New Window Cleaning Quote Request - $${quoteData.finalPrice} - ${quoteData.customerName}`

    console.log("📧 Email content prepared")
    console.log("Subject:", subject)
    console.log("Content preview:", emailContent.substring(0, 200) + "...")

    // For now, we'll simulate the email sending
    // In production, you would integrate with a service like:
    // - EmailJS (frontend email service)
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Or a simple SMTP service

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Log the email for debugging
    console.log("=== EMAIL SIMULATION ===")
    console.log("To: info@westlakewindowcleaners.com")
    console.log("From: quotes@westlakewindowcleaners.com")
    console.log("Reply-To:", quoteData.customerEmail)
    console.log("Subject:", subject)
    console.log("\nContent:\n", emailContent)
    console.log("=== END EMAIL SIMULATION ===")

    return NextResponse.json({
      success: true,
      message: `Email ${isTest ? "test " : ""}processed successfully`,
      simulated: true,
      method: "simulation",
      details: {
        to: "info@westlakewindowcleaners.com",
        subject: subject,
        customerEmail: quoteData.customerEmail,
        quoteAmount: quoteData.finalPrice,
      },
    })
  } catch (error) {
    console.error("💥 Error in send-email-simple route:", error)

    return NextResponse.json(
      {
        success: false,
        error: `Failed to process email: ${error.message}`,
        details: error.stack,
      },
      { status: 500 },
    )
  }
}

function formatEmailContent(quoteData: any, isTest = false) {
  const testPrefix = isTest ? "[TEST EMAIL - PLEASE IGNORE] " : ""

  return `
${testPrefix}🏠 NEW WINDOW CLEANING QUOTE REQUEST

💰 QUOTE AMOUNT: $${quoteData.finalPrice}

👤 CUSTOMER INFORMATION:
- Name: ${quoteData.customerName}
- Email: ${quoteData.customerEmail}
- Phone: ${quoteData.customerPhone}
- Address: ${quoteData.address}

🏡 PROPERTY DETAILS:
- Square Footage: ${quoteData.squareFootage} sq ft
- Number of Stories: ${quoteData.stories}
- Service Type: ${quoteData.serviceType.replace("-", " ").toUpperCase()}
- Distance from office: ${quoteData.distance?.toFixed(1) || "N/A"} miles

✅ SERVICES REQUESTED:
${quoteData.addons.length > 0 ? quoteData.addons.map((addon: string) => `- ${addon} cleaning`).join("\n") : "- Standard window cleaning only"}
${quoteData.hasSkylights ? "\n⚠️  SPECIAL NOTE: Customer has skylights or hard-to-reach glass that needs separate quote on-site." : ""}

💵 PRICING BREAKDOWN:
- Base Service: $${quoteData.basePrice?.toFixed(2) || "N/A"}
${quoteData.addons.length > 0 ? `- Add-on Services: $${quoteData.addonCosts?.toFixed(2) || "0.00"}` : ""}
- TOTAL QUOTED: $${quoteData.finalPrice}

Source: Online Calculator (Quote Accepted)
Generated: ${new Date().toLocaleString()}

${quoteData.distance > 10 ? "⚠️  NOTE: Customer may require additional travel time - confirm availability." : ""}
${isTest ? "\n\nTHIS IS A TEST EMAIL - NO ACTION REQUIRED" : ""}

---
Westlake Window Cleaners
13477 Prospect Rd. Strongsville, OH 44149
Phone: (440) 555-CLEAN
Email: info@westlakewindowcleaners.com
`.trim()
}
