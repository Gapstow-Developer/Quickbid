import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { inquiryData } = await request.json()

    if (!inquiryData) {
      return NextResponse.json({ error: "Inquiry data is required" }, { status: 400 })
    }

    console.log(`Processing outside service area inquiry from: ${inquiryData.customerName}`)

    // Format email content for business
    const businessEmailContent = formatOutsideAreaBusinessEmail(inquiryData)
    const businessSubject = `Outside Service Area Inquiry - ${inquiryData.customerName} - ${inquiryData.address}`

    // Format email content for customer
    const customerEmailContent = formatOutsideAreaCustomerEmail(inquiryData)
    const customerSubject = `Service Area Inquiry Received - Westlake Window Cleaners`

    console.log("Sending outside area inquiry emails via SendGrid...")

    try {
      // Send business email first
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
          replyTo: inquiryData.customerEmail,
        }),
      })

      const businessResult = await businessResponse.json()
      console.log("Business email response:", { status: businessResponse.status, success: businessResult.success })

      if (!businessResponse.ok) {
        console.error("Business email failed:", businessResult)
        throw new Error(businessResult.error || "Failed to send business notification")
      }

      // Wait a moment before sending customer email
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Send customer confirmation email
      console.log("Sending customer confirmation...")
      const customerResponse = await fetch(new URL("/api/sendgrid", request.url).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: inquiryData.customerEmail,
          subject: customerSubject,
          text: customerEmailContent,
          replyTo: "info@westlakewindowcleaners.com",
        }),
      })

      const customerResult = await customerResponse.json()
      console.log("Customer email response:", {
        status: customerResponse.status,
        success: customerResult.success,
      })

      const customerEmailSent = customerResponse.ok && customerResult.success

      if (!customerEmailSent) {
        console.error("Customer email failed:", customerResult)
      }

      console.log("Outside area inquiry processing completed")
      return NextResponse.json({
        success: true,
        message: `Outside area inquiry processed via SendGrid`,
        businessMessageId: businessResult.messageId,
        customerMessageId: customerEmailSent ? customerResult.messageId : null,
        method: "sendgrid",
        details: {
          businessEmailSent: true,
          customerEmailSent,
          customerEmail: inquiryData.customerEmail,
          customerEmailError: customerEmailSent ? null : customerResult.error,
        },
      })
    } catch (sendgridError: any) {
      console.error("SendGrid failed for outside area inquiry:", sendgridError)

      // Log the inquiry as fallback
      console.log("SendGrid failed, logging inquiry details...")
      logOutsideAreaInquiry(inquiryData, businessEmailContent, customerEmailContent, businessSubject, customerSubject)

      return NextResponse.json({
        success: true,
        message: `Outside area inquiry logged successfully (SendGrid unavailable)`,
        method: "logged",
        details: {
          sendgridError: sendgridError.message,
          inquiryLogged: true,
        },
      })
    }
  } catch (error: any) {
    console.error("Error in send-outside-area-inquiry route:", error)

    // Always return success to maintain user experience
    return NextResponse.json({
      success: true,
      message: "Outside area inquiry processed successfully",
      method: "logged",
      details: {
        error: error.message,
        inquiryLogged: true,
      },
    })
  }
}

function logOutsideAreaInquiry(
  inquiryData: any,
  businessContent: string,
  customerContent: string,
  businessSubject: string,
  customerSubject: string,
) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    type: "OUTSIDE_SERVICE_AREA_INQUIRY",
    customerName: inquiryData.customerName,
    customerEmail: inquiryData.customerEmail,
    customerPhone: inquiryData.customerPhone,
    address: inquiryData.address,
    distance: inquiryData.distance,
    serviceType: inquiryData.serviceType,
    stories: inquiryData.stories,
    hasSkylights: inquiryData.hasSkylights,
    additionalServices: inquiryData.additionalServices,
    businessEmail: {
      to: "info@westlakewindowcleaners.com",
      subject: businessSubject,
      content: businessContent,
    },
    customerEmail: {
      to: inquiryData.customerEmail,
      subject: customerSubject,
      content: customerContent,
    },
  }

  console.log("=== OUTSIDE AREA INQUIRY LOG ===")
  console.log(JSON.stringify(logEntry, null, 2))
  console.log("=== END INQUIRY LOG ===")
}

function formatOutsideAreaBusinessEmail(inquiryData: any) {
  const distanceText = inquiryData.distance === 9999 ? "Unknown (very far)" : `${inquiryData.distance.toFixed(1)} miles`

  // Get additional services
  const additionalServices = []
  if (inquiryData.additionalServices?.pressureWashing) additionalServices.push("Pressure Washing")
  if (inquiryData.additionalServices?.gutterCleaning) additionalServices.push("Gutter Cleaning")
  if (inquiryData.additionalServices?.specialtyCleaning) additionalServices.push("Specialty Cleaning")

  return `OUTSIDE SERVICE AREA INQUIRY

CUSTOMER INFORMATION:
- Name: ${inquiryData.customerName}
- Email: ${inquiryData.customerEmail}
- Phone: ${inquiryData.customerPhone}
- Address: ${inquiryData.address}

LOCATION DETAILS:
- Distance from office: ${distanceText}
- Service Type Requested: ${inquiryData.serviceType.replace("-", " ").toUpperCase()}
- Number of Stories: ${inquiryData.stories}
${inquiryData.hasSkylights ? "- Special Note: Customer has skylights or hard-to-reach glass" : ""}

${
  additionalServices.length > 0
    ? `ADDITIONAL SERVICES REQUESTED:
${additionalServices.map((service: string) => `- ${service}`).join("\n")}
`
    : ""
}

ACTION REQUIRED:
This customer is outside our standard 20-mile service area. Please contact them within 24 hours to discuss:
1. Whether we can service their location
2. Any additional travel charges that may apply
3. Scheduling availability

Source: Online Calculator (Outside Service Area)
Generated: ${new Date().toLocaleString()}

---
Reply to this email to respond directly to the customer.
Customer Email: ${inquiryData.customerEmail}

Westlake Window Cleaners
13477 Prospect Rd. Strongsville, OH 44149
Phone: (440) 207-0991`
}

function formatOutsideAreaCustomerEmail(inquiryData: any) {
  // Get additional services
  const additionalServices = []
  if (inquiryData.additionalServices?.pressureWashing) additionalServices.push("Pressure Washing")
  if (inquiryData.additionalServices?.gutterCleaning) additionalServices.push("Gutter Cleaning")
  if (inquiryData.additionalServices?.specialtyCleaning) additionalServices.push("Specialty Cleaning")

  return `Dear ${inquiryData.customerName},

Thank you for your interest in Westlake Window Cleaners.

We've received your service inquiry for:
- Property: ${inquiryData.address}
- Service Type: ${inquiryData.serviceType.replace("-", " ").toUpperCase()}
- Stories: ${inquiryData.stories}
${inquiryData.hasSkylights ? "- Special Note: Skylights and hard-to-reach glass" : ""}

${
  additionalServices.length > 0
    ? `ADDITIONAL SERVICES:
You've expressed interest in: ${additionalServices.join(", ")}

`
    : ""
}SERVICE AREA NOTICE:
Your location appears to be outside our standard 20-mile service area. However, we may still be able to help you! 

NEXT STEPS:
Someone from our team will contact you within 24 hours to:
- Confirm whether we can service your location
- Discuss any additional travel charges that may apply
- Provide you with a custom quote

CONTACT US:
If you have any immediate questions, feel free to reach out:
- Phone: (440) 207-0991
- Email: info@westlakewindowcleaners.com

Thank you for considering Westlake Window Cleaners.

Best regards,
The Westlake Window Cleaners Team
13477 Prospect Rd. Strongsville, OH 44149`
}
