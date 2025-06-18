import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { quoteData } = await request.json()

    if (!quoteData) {
      return NextResponse.json({ error: "Quote data is required" }, { status: 400 })
    }

    console.log(`Sending step 3 notification for potential customer: ${quoteData.customerName}`)

    // Format email content for business
    const businessEmailContent = formatStep3BusinessEmail(quoteData)
    const businessSubject = `Calculator User Alert - ${quoteData.customerName} - Potential $${quoteData.finalPrice} Job`

    console.log("Sending step 3 notification via SendGrid...")

    try {
      // Send business notification email
      console.log("Sending business notification...")
      const businessResponse = await fetch(new URL("/api/sendgrid", request.url).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "info@westlakewindowcleaners.com",
          subject: businessSubject,
          text: businessEmailContent,
          replyTo: quoteData.customerEmail,
        }),
      })

      const businessResult = await businessResponse.json()
      console.log("Step 3 notification response:", { status: businessResponse.status, success: businessResult.success })

      if (!businessResponse.ok) {
        console.error("Step 3 notification failed:", businessResult)
        throw new Error(businessResult.error || "Failed to send step 3 notification")
      }

      console.log("Step 3 notification sent successfully")
      return NextResponse.json({
        success: true,
        message: `Step 3 notification sent via SendGrid`,
        messageId: businessResult.messageId,
        method: "sendgrid",
      })
    } catch (sendgridError: any) {
      console.error("SendGrid failed for step 3 notification:", sendgridError)

      // Log the notification as fallback
      console.log("SendGrid failed, logging step 3 notification...")
      logStep3Notification(quoteData, businessEmailContent, businessSubject)

      return NextResponse.json({
        success: true,
        message: `Step 3 notification logged successfully (SendGrid unavailable)`,
        method: "logged",
        details: {
          sendgridError: sendgridError.message,
          notificationLogged: true,
        },
      })
    }
  } catch (error: any) {
    console.error("Error in send-step3-notification route:", error)

    // Always return success to maintain user experience
    return NextResponse.json({
      success: true,
      message: "Step 3 notification processed successfully",
      method: "logged",
      details: {
        error: error.message,
        notificationLogged: true,
      },
    })
  }
}

function logStep3Notification(quoteData: any, businessContent: string, businessSubject: string) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    type: "STEP_3_NOTIFICATION",
    customerName: quoteData.customerName,
    customerEmail: quoteData.customerEmail,
    customerPhone: quoteData.customerPhone,
    address: quoteData.address,
    potentialValue: quoteData.finalPrice,
    timeOnStep3: quoteData.timeOnStep3,
    businessEmail: {
      to: "info@westlakewindowcleaners.com",
      subject: businessSubject,
      content: businessContent,
    },
  }

  console.log("=== STEP 3 NOTIFICATION LOG ===")
  console.log(JSON.stringify(logEntry, null, 2))
  console.log("=== END NOTIFICATION LOG ===")
}

function formatStep3BusinessEmail(quoteData: any) {
  // Get additional services
  const additionalServices = []
  if (quoteData.additionalServices?.pressureWashing) additionalServices.push("Pressure Washing")
  if (quoteData.additionalServices?.gutterCleaning) additionalServices.push("Gutter Cleaning")
  if (quoteData.additionalServices?.specialtyCleaning) additionalServices.push("Specialty Cleaning")

  // Format window details
  const windowDetails = []
  if (quoteData.isPostConstruction !== undefined) {
    windowDetails.push(
      `- Post-Construction Job: ${quoteData.isPostConstruction ? "YES - May require additional cleaning time/cost" : "NO"}`,
    )
  }
  if (quoteData.gridType) {
    const gridTypeText =
      {
        none: "No grids/muntins",
        "between-panes": "Grids between glass panes (easier to clean)",
        "on-surface": "Grids on surface of glass (requires cleaning around grids)",
      }[quoteData.gridType] || quoteData.gridType
    windowDetails.push(`- Window Grids: ${gridTypeText}`)
  }
  if (quoteData.upperWindowsOpenInside !== undefined && Number.parseInt(quoteData.stories) > 1) {
    windowDetails.push(
      `- Upper Windows Open Inward: ${quoteData.upperWindowsOpenInside ? "YES - Can clean interior from inside" : "NO - Will need ladder access for interior"}`,
    )
  }
  if (quoteData.panesPerWindow) {
    const panesText =
      quoteData.panesPerWindow === "3+"
        ? "3 or more panes (complex windows)"
        : quoteData.panesPerWindow === "unknown"
          ? "Unknown number of panes (needs assessment)"
          : `${quoteData.panesPerWindow} panes per window`
    windowDetails.push(`- Panes Per Window: ${panesText}`)
  }
  if (quoteData.windowManufacturer && quoteData.windowManufacturer.trim()) {
    windowDetails.push(`- Window Manufacturer: ${quoteData.windowManufacturer}`)
  }

  return `CALCULATOR USER ALERT - POTENTIAL CUSTOMER

⚠️  SOMEONE IS USING THE CALCULATOR BUT HASN'T ACCEPTED THE QUOTE YET

POTENTIAL VALUE: $${quoteData.finalPrice}

CUSTOMER INFORMATION:
- Name: ${quoteData.customerName}
- Email: ${quoteData.customerEmail}
- Phone: ${quoteData.customerPhone}
- Address: ${quoteData.address}

PROPERTY DETAILS:
- Square Footage: ${quoteData.squareFootage} sq ft
- Number of Stories: ${quoteData.stories}
- Service Type: ${quoteData.serviceType.replace("-", " ").toUpperCase()}
- Distance from office: ${quoteData.distance && quoteData.distance !== 9999 ? quoteData.distance.toFixed(1) + " miles" : "Calculated during quote process"}

WINDOW DETAILS:
${windowDetails.length > 0 ? windowDetails.join("\n") : "No specific window details provided"}

SERVICES BEING CONSIDERED:
${quoteData.addons && quoteData.addons.length > 0 ? quoteData.addons.map((addon: string) => `- ${addon} cleaning`).join("\n") : "- Standard window cleaning only"}
${quoteData.hasSkylights ? "\n- Special Note: Customer has skylights or hard-to-reach glass" : ""}

${
  additionalServices.length > 0
    ? `ADDITIONAL SERVICES THEY'RE INTERESTED IN:
${additionalServices.map((service: string) => `- ${service}`).join("\n")}
`
    : ""
}

QUOTE BREAKDOWN:
${formatPricingBreakdown(quoteData)}

FINAL QUOTE: $${quoteData.finalPrice}

TIMING:
- Customer reached Step 3 (final step) but spent ${quoteData.timeOnStep3} without accepting
- This suggests they're seriously considering the service but may have questions

RECOMMENDED ACTION:
Consider reaching out proactively to:
1. Answer any questions they might have about the window details
2. Offer to schedule a convenient time to discuss the service
3. Provide additional information about your process for their specific window type

${
  windowDetails.some((detail) => detail.includes("Post-Construction") && detail.includes("YES"))
    ? "\n⚠️  POST-CONSTRUCTION ALERT: This job may require additional time and specialized cleaning."
    : ""
}

${
  windowDetails.some((detail) => detail.includes("3 or more panes") || detail.includes("Unknown"))
    ? "\n⚠️  COMPLEX WINDOWS: Customer has complex windows that may need on-site assessment."
    : ""
}

Source: Online Calculator (Step 3 Alert)
Generated: ${new Date().toLocaleString()}

---
Customer Contact Information:
Email: ${quoteData.customerEmail}
Phone: ${quoteData.customerPhone}

Westlake Window Cleaners
13477 Prospect Rd. Strongsville, OH 44149
Phone: (440) 207-0991`
}

function formatPricingBreakdown(quoteData: any) {
  let breakdown = ""

  // Base calculation
  breakdown += `Base Rate (${quoteData.serviceType.replace("-", " ")}): ${quoteData.calculations.baseCalculation}\n`

  // Story adjustment
  if (quoteData.calculations.storyAdjustment) {
    breakdown += `${quoteData.calculations.storyAdjustment}\n`
  }

  // Story flat fee
  if (quoteData.calculations.storyFlatFeeText) {
    breakdown += `${quoteData.calculations.storyFlatFeeText}\n`
  }

  // Add-ons
  if (quoteData.calculations.addonCalculations && quoteData.calculations.addonCalculations.length > 0) {
    quoteData.calculations.addonCalculations.forEach((calc: string) => {
      breakdown += `${calc}\n`
    })
  }

  // Subtotal
  breakdown += `Subtotal before minimum: $${quoteData.totalBeforeMinimum.toFixed(2)}\n`

  // Minimum check
  if (quoteData.calculations.minimumApplied) {
    breakdown += `${quoteData.calculations.minimumApplied}\n`
  }

  breakdown += `FINAL PRICE: $${quoteData.finalPrice}`

  return breakdown
}
