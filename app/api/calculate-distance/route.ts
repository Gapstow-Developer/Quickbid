import { type NextRequest, NextResponse } from "next/server"

const GOOGLE_MAPS_API_KEY = "AIzaSyAPgad6Y-v0_gOf6IbTplAIniz34cUSHc0"
const BUSINESS_ADDRESS = "13477 Prospect Rd. Strongsville, OH 44149"

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 })
    }

    console.log(`Calculating distance from office to: ${address}`)

    // Use Google Distance Matrix API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(BUSINESS_ADDRESS)}&destinations=${encodeURIComponent(address)}&units=imperial&key=${GOOGLE_MAPS_API_KEY}`,
    )

    const data = await response.json()
    console.log("Google Distance Matrix API response:", {
      status: data.status,
      rowsLength: data.rows?.length,
      firstElementStatus: data.rows?.[0]?.elements?.[0]?.status,
      distance: data.rows?.[0]?.elements?.[0]?.distance?.text,
      duration: data.rows?.[0]?.elements?.[0]?.duration?.text,
    })

    if (data.status === "OK" && data.rows[0].elements[0].status === "OK") {
      const distanceText = data.rows[0].elements[0].distance.text
      const durationText = data.rows[0].elements[0].duration.text

      // Parse distance - handle both "mi" and "miles" and comma-separated numbers
      let distanceMiles = 0

      if (distanceText.includes("mi")) {
        // Extract number from text like "1,234 mi" or "1,234 miles"
        const numberMatch = distanceText.match(/[\d,]+/)
        if (numberMatch) {
          distanceMiles = Number.parseFloat(numberMatch[0].replace(/,/g, ""))
        }
      }

      console.log(`Successfully calculated distance: ${distanceMiles} miles`)

      return NextResponse.json({
        success: true,
        distance: distanceMiles,
        duration: durationText,
        distanceText: distanceText,
        debug: {
          apiStatus: data.status,
          elementStatus: data.rows[0].elements[0].status,
          rawDistance: distanceText,
          parsedDistance: distanceMiles,
        },
      })
    } else {
      // Log the specific error from Google API
      console.error("Google Distance Matrix API error:", {
        apiStatus: data.status,
        elementStatus: data.rows?.[0]?.elements?.[0]?.status,
        errorMessage: data.error_message,
        fullResponse: data,
      })

      // For addresses that Google can't route to, return a very high distance
      // This ensures addresses like international locations get flagged as outside service area
      console.log("API failed - returning high distance to trigger service area check")

      return NextResponse.json({
        success: true,
        distance: 9999, // Very high distance to ensure it's outside service area
        duration: "N/A",
        distanceText: "Distance unavailable",
        fallback: true,
        debug: {
          apiStatus: data.status,
          elementStatus: data.rows?.[0]?.elements?.[0]?.status,
          errorMessage: data.error_message,
          reason: "Google API could not calculate route - likely outside reasonable driving distance",
        },
      })
    }
  } catch (error) {
    console.error("Error calculating distance:", error)

    // For any network or other errors, also return high distance
    return NextResponse.json({
      success: true,
      distance: 9999, // Very high distance to ensure it's outside service area
      duration: "N/A",
      distanceText: "Distance unavailable",
      fallback: true,
      debug: {
        error: error.message,
        reason: "Network or API error - defaulting to outside service area",
      },
    })
  }
}
