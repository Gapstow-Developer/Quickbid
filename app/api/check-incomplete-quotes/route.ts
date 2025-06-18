import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST() {
  try {
    console.log("🔍 Checking for incomplete quotes needing follow-up...")

    const supabase = createServerSupabaseClient()

    // Get incomplete quotes that are older than 10 minutes and haven't had follow-up sent
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

    const { data: incompleteQuotes, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("status", "incomplete")
      .lt("created_at", tenMinutesAgo)
      .is("followup_sent_at", null) // Only quotes that haven't had follow-up sent
      .not("customer_email", "is", null)
      .not("customer_name", "is", null)

    if (error) {
      console.error("❌ Error fetching incomplete quotes:", error)
      throw new Error(`Failed to fetch incomplete quotes: ${error.message}`)
    }

    console.log(`📊 Found ${incompleteQuotes?.length || 0} incomplete quotes needing follow-up`)

    if (!incompleteQuotes || incompleteQuotes.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No incomplete quotes need follow-up at this time",
        processed: 0,
      })
    }

    let successCount = 0
    let errorCount = 0

    // Process each incomplete quote
    for (const quote of incompleteQuotes) {
      try {
        console.log(`📧 Processing follow-up for quote ${quote.id} - ${quote.customer_name}`)

        // Check if this quote was later submitted (double-check)
        const { data: submittedCheck, error: checkError } = await supabase
          .from("quotes")
          .select("id")
          .eq("customer_email", quote.customer_email)
          .eq("customer_phone", quote.customer_phone)
          .eq("status", "submitted")
          .gte("created_at", quote.created_at)

        if (checkError) {
          console.error(`❌ Error checking submitted status for quote ${quote.id}:`, checkError)
          continue
        }

        if (submittedCheck && submittedCheck.length > 0) {
          console.log(`✅ Quote ${quote.id} was later submitted, skipping follow-up`)

          // Mark as follow-up sent to avoid future processing
          await supabase.from("quotes").update({ followup_sent_at: new Date().toISOString() }).eq("id", quote.id)

          continue
        }

        // Prepare quote data for email
        const quoteData = {
          customerName: quote.customer_name,
          customerEmail: quote.customer_email,
          customerPhone: quote.customer_phone,
          address: quote.address,
          serviceType: quote.service_type,
          stories: quote.stories,
          squareFootage: quote.square_footage,
          addons: quote.addons || [],
          hasSkylights: quote.has_skylights,
          additionalServices: quote.additional_services || {},
          finalPrice: quote.final_price,
          lastStepCompleted: quote.last_step_completed,
        }

        // Send follow-up email
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

        if (emailResult.success) {
          console.log(`✅ Follow-up email sent for quote ${quote.id}`)

          // Mark the quote as having follow-up sent
          await supabase.from("quotes").update({ followup_sent_at: new Date().toISOString() }).eq("id", quote.id)

          successCount++
        } else {
          console.error(`❌ Failed to send follow-up email for quote ${quote.id}:`, emailResult.error)
          errorCount++
        }

        // Add a small delay between emails to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (quoteError: any) {
        console.error(`❌ Error processing quote ${quote.id}:`, quoteError)
        errorCount++
      }
    }

    console.log(`📊 Follow-up processing complete: ${successCount} sent, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      message: `Processed ${incompleteQuotes.length} incomplete quotes`,
      sent: successCount,
      errors: errorCount,
      processed: incompleteQuotes.length,
    })
  } catch (error: any) {
    console.error("❌ Error in check-incomplete-quotes:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to check incomplete quotes",
      },
      { status: 500 },
    )
  }
}

// Also allow GET for manual testing
export async function GET() {
  return POST()
}
