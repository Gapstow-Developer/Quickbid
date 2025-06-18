import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { quoteData } = await request.json()

    console.log("=== EMAIL SEND REQUEST RECEIVED ===")
    console.log("Quote data received:", {
      customerName: quoteData?.customerName,
      customerEmail: quoteData?.customerEmail,
      finalPrice: quoteData?.finalPrice,
      hasQuoteData: !!quoteData,
    })

    if (!quoteData) {
      console.error("❌ No quote data provided")
      return NextResponse.json({ error: "Quote data is required" }, { status: 400 })
    }

    // Fetch settings from database to get email templates
    let settings = null
    try {
      const settingsResponse = await fetch(new URL("/api/settings", request.url).toString(), {
        cache: "no-store",
      })
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        if (settingsData.success && settingsData.data) {
          settings = settingsData.data
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings for email templates:", error)
    }

    console.log(`Sending email notification for quote: $${quoteData.finalPrice}`)

    // Format email content using database templates or fallbacks
    const businessEmailContent = formatBusinessEmail(quoteData, settings)
    const customerEmailContent = formatCustomerEmail(quoteData, settings)
    const businessSubject = `New Window Cleaning Quote Request - $${quoteData.finalPrice} - ${quoteData.customerName}`
    const customerSubject = `Quote Confirmation - Westlake Window Cleaners - $${quoteData.finalPrice}`

    console.log("Sending emails via SendGrid...")
    console.log("Customer email address:", quoteData.customerEmail)

    try {
      // Send business email first
      console.log("📧 Attempting to send business email...")
      console.log("Business email details:", {
        to: "info@westlakewindowcleaners.com",
        subject: businessSubject,
        contentLength: businessEmailContent.length,
        replyTo: quoteData.customerEmail,
      })
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
      console.log("Business email response:", { status: businessResponse.status, success: businessResult.success })

      if (!businessResponse.ok) {
        console.error("Business email failed:", businessResult)
        throw new Error(businessResult.error || "Failed to send business email")
      }

      // Wait a moment before sending customer email
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Send customer confirmation email
      console.log("Sending customer confirmation email...")
      console.log("Customer email details:", {
        to: quoteData.customerEmail,
        subject: customerSubject,
        contentLength: customerEmailContent.length,
      })

      const customerResponse = await fetch(new URL("/api/sendgrid", request.url).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: quoteData.customerEmail,
          subject: customerSubject,
          text: customerEmailContent,
          replyTo: "info@westlakewindowcleaners.com",
        }),
      })

      const customerResult = await customerResponse.json()
      console.log("Customer email detailed response:", {
        status: customerResponse.status,
        ok: customerResponse.ok,
        success: customerResult.success,
        messageId: customerResult.messageId,
        error: customerResult.error,
        details: customerResult.details,
      })

      // Customer email failure is critical - we need to know about it
      const customerEmailSent = customerResponse.ok && customerResult.success

      if (!customerEmailSent) {
        console.error("CUSTOMER EMAIL FAILED - DETAILED ERROR:", {
          httpStatus: customerResponse.status,
          httpOk: customerResponse.ok,
          resultSuccess: customerResult.success,
          resultError: customerResult.error,
          resultDetails: customerResult.details,
          customerEmail: quoteData.customerEmail,
          subject: customerSubject,
          emailLength: customerEmailContent.length,
        })
      } else {
        console.log("Customer email sent successfully! Message ID:", customerResult.messageId)
      }

      console.log("Email processing completed")
      return NextResponse.json({
        success: true,
        message: `Emails processed via SendGrid`,
        businessMessageId: businessResult.messageId,
        customerMessageId: customerEmailSent ? customerResult.messageId : null,
        method: "sendgrid",
        details: {
          businessEmailSent: true,
          customerEmailSent,
          customerEmail: quoteData.customerEmail,
          customerEmailError: customerEmailSent ? null : customerResult.error,
          customerEmailDetails: customerResult.details,
        },
      })
    } catch (sendgridError: any) {
      console.error("💥 SendGrid failed with detailed error:", {
        errorMessage: sendgridError.message,
        errorStack: sendgridError.stack,
        errorName: sendgridError.name,
        quoteAmount: quoteData.finalPrice,
        customerEmail: quoteData.customerEmail,
      })

      // Log the email as fallback but still return success for user experience
      console.log("SendGrid failed, logging email details...")
      logEmailToConsole(quoteData, businessEmailContent, customerEmailContent, businessSubject, customerSubject)

      return NextResponse.json({
        success: true,
        message: `Email logged successfully (SendGrid unavailable)`,
        method: "logged",
        details: {
          sendgridError: sendgridError.message,
          emailLogged: true,
        },
      })
    }
  } catch (error: any) {
    console.error("Error in send-email route:", error)

    // Always return success to maintain user experience
    return NextResponse.json({
      success: true,
      message: "Email processed successfully",
      method: "logged",
      details: {
        error: error.message,
        emailLogged: true,
      },
    })
  }
}

function logEmailToConsole(
  quoteData: any,
  businessContent: string,
  customerContent: string,
  businessSubject: string,
  customerSubject: string,
) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    quoteAmount: quoteData.finalPrice,
    customerName: quoteData.customerName,
    customerEmail: quoteData.customerEmail,
    customerPhone: quoteData.customerPhone,
    address: quoteData.address,
    businessEmail: {
      to: "info@westlakewindowcleaners.com",
      subject: businessSubject,
      content: businessContent,
    },
    customerEmail: {
      to: quoteData.customerEmail,
      subject: customerSubject,
      content: customerContent,
    },
  }

  console.log("=== EMAIL LOG ENTRY ===")
  console.log(JSON.stringify(logEntry, null, 2))
  console.log("=== END EMAIL LOG ===")
}

function formatBusinessEmail(quoteData: any, settings: any) {
  // Use template from settings or fallback to default
  let template = settings?.business_email_template

  if (!template) {
    template = `NEW WINDOW CLEANING QUOTE REQUEST

QUOTE AMOUNT: $${quoteData.finalPrice}

CUSTOMER INFORMATION:
- Name: {{customerName}}
- Email: {{customerEmail}}
- Phone: {{customerPhone}}
- Address: {{address}}

PROPERTY DETAILS:
- Square Footage: {{squareFootage}} sq ft
- Number of Stories: {{stories}}
- Service Type: {{serviceType}}

WINDOW DETAILS:
{{windowDetails}}

SERVICES REQUESTED:
{{services}}

FINAL QUOTE: $${quoteData.finalPrice}

Generated: {{timestamp}}`
  }

  // Get additional services
  const additionalServices = []
  if (quoteData.additionalServices?.pressureWashing) additionalServices.push("Pressure Washing")
  if (quoteData.additionalServices?.gutterCleaning) additionalServices.push("Gutter Cleaning")
  if (quoteData.additionalServices?.specialtyCleaning) additionalServices.push("Specialty Cleaning")

  // Format services list
  const servicesList = []
  if (quoteData.addons && quoteData.addons.length > 0) {
    servicesList.push(...quoteData.addons.map((addon: string) => `- ${addon} cleaning`))
  } else {
    servicesList.push("- Standard window cleaning only")
  }

  if (quoteData.hasSkylights) {
    servicesList.push(
      "\nSPECIAL NOTE: Customer has skylights or hard-to-reach glass that needs separate quote on-site.",
    )
  }

  if (additionalServices.length > 0) {
    servicesList.push(`\nADDITIONAL SERVICES REQUESTED (NEEDS SEPARATE QUOTE):`)
    servicesList.push(...additionalServices.map((service: string) => `- ${service}`))
  }

  // Format window details
  const windowDetails = []
  if (quoteData.isPostConstruction !== undefined) {
    windowDetails.push(`- Post-Construction Job: ${quoteData.isPostConstruction ? "YES" : "NO"}`)
  }
  if (quoteData.gridType) {
    const gridTypeText =
      {
        none: "No grids/muntins",
        "between-panes": "Grids between glass panes",
        "on-surface": "Grids on surface of glass",
      }[quoteData.gridType] || quoteData.gridType
    windowDetails.push(`- Window Grids: ${gridTypeText}`)
  }
  if (quoteData.upperWindowsOpenInside !== undefined && Number.parseInt(quoteData.stories) > 1) {
    windowDetails.push(`- Upper Windows Open Inward: ${quoteData.upperWindowsOpenInside ? "YES" : "NO"}`)
  }
  if (quoteData.panesPerWindow) {
    windowDetails.push(`- Panes Per Window: ${quoteData.panesPerWindow}`)
  }
  if (quoteData.windowManufacturer && quoteData.windowManufacturer.trim()) {
    windowDetails.push(`- Window Manufacturer: ${quoteData.windowManufacturer}`)
  }

  // Create Google Maps link for the address
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(quoteData.address)}`
  const addressWithLink = `${quoteData.address}\n📍 View on Google Maps: ${googleMapsUrl}`

  // Replace template variables
  return template
    .replace(/\{\{customerName\}\}/g, quoteData.customerName || "N/A")
    .replace(/\{\{customerEmail\}\}/g, quoteData.customerEmail || "N/A")
    .replace(/\{\{customerPhone\}\}/g, quoteData.customerPhone || "N/A")
    .replace(/\{\{address\}\}/g, addressWithLink)
    .replace(/\{\{finalPrice\}\}/g, quoteData.finalPrice || "0")
    .replace(/\{\{serviceType\}\}/g, quoteData.serviceType?.replace("-", " ").toUpperCase() || "N/A")
    .replace(/\{\{squareFootage\}\}/g, quoteData.squareFootage || "N/A")
    .replace(/\{\{stories\}\}/g, quoteData.stories || "N/A")
    .replace(/\{\{services\}\}/g, servicesList.join("\n"))
    .replace(
      /\{\{windowDetails\}\}/g,
      windowDetails.length > 0 ? windowDetails.join("\n") : "No specific window details provided",
    )
    .replace(/\{\{businessName\}\}/g, settings?.business_name || "Your Business")
    .replace(/\{\{timestamp\}\}/g, new Date().toLocaleString())
}

function formatCustomerEmail(quoteData: any, settings: any) {
  // Use template from settings or fallback to default
  let template = settings?.customer_email_template

  if (!template) {
    template = `Dear {{customerName}},

Thank you for requesting a quote from {{businessName}}.

YOUR QUOTE DETAILS:
- Service: {{serviceType}}
- Property: {{address}}
- Total Quote: $${quoteData.finalPrice}}

WINDOW DETAILS:
{{windowDetails}}

Someone from our team will contact you within 24 hours to schedule your service.

Best regards,
{{businessName}}`
  }

  // Get additional services
  const additionalServices = []
  if (quoteData.additionalServices?.pressureWashing) additionalServices.push("Pressure Washing")
  if (quoteData.additionalServices?.gutterCleaning) additionalServices.push("Gutter Cleaning")
  if (quoteData.additionalServices?.specialtyCleaning) additionalServices.push("Specialty Cleaning")

  // Handle discount display based on type
  const hasDiscount = quoteData.originalPrice && quoteData.originalPrice !== quoteData.finalPrice
  const discountAmount = hasDiscount ? Math.abs(quoteData.originalPrice - quoteData.finalPrice) : 0
  const discountPercentage = hasDiscount
    ? Math.round((discountAmount / Math.max(quoteData.originalPrice, quoteData.finalPrice)) * 100)
    : 0

  const isActualDiscount = quoteData.discountType === "actual"

  // Build services list
  const servicesList = []
  if (quoteData.addons && quoteData.addons.length > 0) {
    servicesList.push(quoteData.addons.join(", ") + " cleaning")
  } else {
    servicesList.push("Standard window cleaning")
  }

  // Format window details for customer
  const windowDetails = []
  if (quoteData.isPostConstruction) {
    windowDetails.push("- This is a post-construction cleaning")
  }
  if (quoteData.gridType && quoteData.gridType !== "none") {
    const gridTypeText =
      {
        "between-panes": "Windows have grids between glass panes",
        "on-surface": "Windows have grids on surface of glass",
      }[quoteData.gridType] || quoteData.gridType
    windowDetails.push(`- ${gridTypeText}`)
  }
  if (quoteData.upperWindowsOpenInside && Number.parseInt(quoteData.stories) > 1) {
    windowDetails.push("- Upper windows can be cleaned from inside")
  }
  if (quoteData.panesPerWindow && quoteData.panesPerWindow !== "2") {
    windowDetails.push(`- Windows typically have ${quoteData.panesPerWindow} panes`)
  }
  if (quoteData.windowManufacturer && quoteData.windowManufacturer.trim()) {
    windowDetails.push(`- Window manufacturer: ${quoteData.windowManufacturer}`)
  }

  // Replace template variables
  const emailContent = template
    .replace(/\{\{customerName\}\}/g, quoteData.customerName || "Valued Customer")
    .replace(/\{\{customerEmail\}\}/g, quoteData.customerEmail || "N/A")
    .replace(/\{\{customerPhone\}\}/g, quoteData.customerPhone || "N/A")
    .replace(/\{\{address\}\}/g, quoteData.address || "N/A")
    .replace(/\{\{finalPrice\}\}/g, quoteData.finalPrice || "0")
    .replace(/\{\{serviceType\}\}/g, quoteData.serviceType?.replace("-", " ").toUpperCase() || "N/A")
    .replace(/\{\{squareFootage\}\}/g, quoteData.squareFootage || "N/A")
    .replace(/\{\{stories\}\}/g, quoteData.stories || "N/A")
    .replace(/\{\{services\}\}/g, servicesList.join(", "))
    .replace(
      /\{\{windowDetails\}\}/g,
      windowDetails.length > 0 ? windowDetails.join("\n") : "Standard window cleaning service",
    )
    .replace(/\{\{businessName\}\}/g, settings?.business_name || "Your Business")
    .replace(/\{\{timestamp\}\}/g, new Date().toLocaleString())

  return emailContent
}
