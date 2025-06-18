import { type NextRequest, NextResponse } from "next/server"

// SerpAPI configuration
const SERPAPI_KEY = "363a93961d970bce443ac864032ff4ff05194ecb84274807146dd8a8139669ee"

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 })
    }

    console.log(`Starting property search for: ${address}`)

    // Parse address components for better matching
    const addressParts = parseAddress(address)
    console.log("Parsed address:", addressParts)

    // Use more effective search queries for SerpAPI - prioritize the best ones
    const searchQueries = [`${address} square feet property`, `${address} home size`, `${address}`]

    let propertyData = null
    let searchAttempts = 0
    let successfulSearchResults = null
    let successfulSearchQuery = null
    let successfulSearchUrl = null
    const allFoundData: any[] = []

    // Try each search query until we find results
    for (const query of searchQueries) {
      try {
        searchAttempts++

        // SerpAPI URL
        const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}&num=10`

        console.log(`Search attempt ${searchAttempts}: "${query}"`)

        const response = await fetch(searchUrl)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`SerpAPI error (${response.status}):`, errorText)
          continue
        }

        const searchResults = await response.json()

        console.log(`Search results for "${query}":`, {
          totalResults: searchResults.search_information?.total_results || 0,
          organicResultsCount: searchResults.organic_results?.length || 0,
        })

        if (searchResults.error) {
          console.error("SerpAPI error:", searchResults.error)
          continue
        }

        if (searchResults.organic_results && searchResults.organic_results.length > 0) {
          // Store the search results for debugging
          if (!successfulSearchResults) {
            successfulSearchResults = searchResults
            successfulSearchQuery = query
            successfulSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`
          }

          // Analyze search results for square footage with address matching
          const extractedData = extractSquareFootageFromResults(searchResults.organic_results, address, addressParts)

          if (extractedData && extractedData.length > 0) {
            console.log(`Found ${extractedData.length} potential matches from this query`)
            allFoundData.push(...extractedData)

            // If we found ANY reasonable match (not just exact), use it and stop searching
            const goodMatch = extractedData.find(
              (data) =>
                data.addressMatch === "exact" ||
                data.addressMatch === "partial" ||
                (data.addressMatch === "general" && data.confidence > 0.4),
            )

            if (goodMatch) {
              console.log("Found good address match, stopping search:", goodMatch)
              propertyData = goodMatch
              break
            }

            // Even if no good address match, if we found square footage from trusted sites, use it
            const trustedSiteMatch = extractedData.find(
              (data) =>
                data.confidence > 0.5 &&
                (data.source.includes("zillow") || data.source.includes("realtor") || data.source.includes("redfin")),
            )

            if (trustedSiteMatch) {
              console.log("Found trusted site match, stopping search:", trustedSiteMatch)
              propertyData = trustedSiteMatch
              break
            }
          }
        }
      } catch (searchError) {
        console.error(`Search query failed: ${query}`, searchError)
        continue
      }
    }

    // If no exact match found, use the best available match
    if (!propertyData && allFoundData.length > 0) {
      // Sort by address match quality and confidence
      allFoundData.sort((a, b) => {
        // Prioritize exact matches, then partial matches, then general matches
        const matchPriority = { exact: 3, partial: 2, general: 1 }
        const aPriority = matchPriority[a.addressMatch] || 0
        const bPriority = matchPriority[b.addressMatch] || 0

        if (aPriority !== bPriority) return bPriority - aPriority

        // Then sort by confidence
        return b.confidence - a.confidence
      })

      propertyData = allFoundData[0]
      console.log("Using best available match:", propertyData)
    }

    // If still no data found, return a helpful error with manual entry suggestion
    if (!propertyData) {
      console.log("No property data found after all search attempts")
      return NextResponse.json(
        {
          success: false,
          error: "Unable to find square footage data for this address. Please enter your square footage manually.",
          needsManualEntry: true,
          debug: {
            searchAttempts,
            address,
            foundResults: allFoundData.length,
            message: "No matching property data found in search results",
            searchQuery: successfulSearchQuery,
            searchUrl: successfulSearchUrl,
            rawSearchResults: (successfulSearchResults?.organic_results || []).slice(0, 6).map((item, index) => ({
              index: index + 1,
              title: item.title,
              snippet: item.snippet,
              link: item.link,
              displayed_link: item.displayed_link,
            })),
          },
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        estimatedSquareFootage: propertyData.squareFootage,
        confidence: propertyData.confidence,
        reasoning: propertyData.reasoning,
        propertyType: propertyData.propertyType,
        source: propertyData.source,
        addressMatch: propertyData.addressMatch,
        searchSources: allFoundData.slice(0, 3).map((data) => ({
          title: data.title,
          url: data.link,
          squareFootage: data.squareFootage,
          addressMatch: data.addressMatch,
        })),
        // Add search debugging information
        searchQuery: successfulSearchQuery,
        searchUrl: successfulSearchUrl,
        // Add raw search results for debugging
        rawSearchResults: (successfulSearchResults?.organic_results || []).slice(0, 6).map((item, index) => ({
          index: index + 1,
          title: item.title,
          snippet: item.snippet,
          link: item.link,
          displayed_link: item.displayed_link,
        })),
      },
    })
  } catch (error) {
    console.error("Error searching for property:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to search for property data. Please enter your square footage manually.",
        needsManualEntry: true,
        debug: {
          error: error.message,
          stack: error.stack,
        },
      },
      { status: 500 },
    )
  }
}

function parseAddress(address: string) {
  // Improved address parsing to handle various formats
  const cleanAddress = address.trim().replace(/,/g, " ").replace(/\s+/g, " ")
  const parts = cleanAddress.split(" ")

  // Find the street number (first numeric part)
  const streetNumber = parts[0] || ""

  // Extract street name (everything between number and city/state)
  let streetName = ""
  let city = ""
  let state = ""
  let zipCode = ""

  // Look for common state abbreviations or zip codes to identify the end
  const statePattern = /^[A-Z]{2}$/
  const zipPattern = /^\d{5}(-\d{4})?$/

  let cityStateIndex = -1
  for (let i = parts.length - 1; i >= 0; i--) {
    if (statePattern.test(parts[i]) || zipPattern.test(parts[i])) {
      cityStateIndex = i
      break
    }
  }

  if (cityStateIndex > 0) {
    streetName = parts.slice(1, cityStateIndex - 1).join(" ")
    city = parts[cityStateIndex - 1] || ""
    state = parts[cityStateIndex] || ""
    if (cityStateIndex + 1 < parts.length) {
      zipCode = parts[cityStateIndex + 1] || ""
    }
  } else {
    // Fallback parsing
    streetName = parts.slice(1, -2).join(" ") || ""
    city = parts[parts.length - 2] || ""
    state = parts[parts.length - 1] || ""
  }

  return {
    streetNumber: streetNumber.toLowerCase(),
    streetName: streetName.toLowerCase(),
    city: city.toLowerCase(),
    state: state.toLowerCase(),
    zipCode: zipCode,
    full: address.toLowerCase(),
  }
}

function extractSquareFootageFromResults(searchResults: any[], targetAddress: string, addressParts: any) {
  const foundData: any[] = []

  console.log(`Analyzing ${searchResults.length} search results for square footage...`)
  console.log(`Target address: "${targetAddress}"`)
  console.log(`Parsed address parts:`, addressParts)

  // Log all search results first to see what we're getting
  searchResults.forEach((result, index) => {
    console.log(`\n=== SEARCH RESULT ${index + 1} ===`)
    console.log(`Title: ${result.title}`)
    console.log(`Snippet: ${result.snippet}`)
    console.log(`URL: ${result.link}`)
    console.log(`Displayed Link: ${result.displayed_link || "N/A"}`)
  })

  for (const result of searchResults) {
    const title = result.title || ""
    const snippet = result.snippet || ""
    const link = result.link || ""
    const combinedText = `${title} ${snippet}`.toLowerCase()

    console.log(`\n--- Analyzing Result ---`)
    console.log(`Title: ${title.substring(0, 100)}...`)
    console.log(`Combined text: ${combinedText.substring(0, 200)}...`)

    // Check how well this result matches the target address
    const addressMatch = calculateAddressMatch(combinedText, targetAddress, addressParts)
    console.log(`Address match quality: ${addressMatch}`)

    // Process ALL results, not just ones with address matches
    // This is important because sometimes the square footage is in the result
    // but the address matching logic might be too strict

    // Look for square footage patterns with comprehensive matching
    const sqftPatterns = [
      // Standard patterns
      /(\d{1,4}(?:,\d{3})*)\s*(?:sq\.?\s*ft\.?|sqft|square\s*feet)/gi,
      /(\d{1,4}(?:,\d{3})*)\s*sf\b/gi,
      /square\s*footage[:\s]*(\d{1,4}(?:,\d{3})*)/gi,
      /(\d{1,4}(?:,\d{3})*)\s*square\s*foot/gi,

      // Additional comprehensive patterns
      /(\d{1,4},\d{3})\s*(?:sq\.?\s*ft\.?|sqft|square\s*feet)/gi,
      /(\d{1,4},\d{3})\s*sf\b/gi,

      // Patterns with various spacing and punctuation
      /(\d{1,4})\s*,?\s*(\d{3})\s*(?:sq\.?\s*ft\.?|sqft|square\s*feet)/gi,
      /(\d{1,4})\s*,?\s*(\d{3})\s*sf\b/gi,

      // Patterns without commas for 4-digit numbers
      /(\d{4})\s*(?:sq\.?\s*ft\.?|sqft|square\s*feet)/gi,
      /(\d{4})\s*sf\b/gi,

      // Patterns with "approximately" or "about"
      /(?:approximately|about|~)\s*(\d{1,4}(?:,\d{3})*)\s*(?:sq\.?\s*ft\.?|sqft|square\s*feet)/gi,

      // Patterns with different word orders
      /(?:sq\.?\s*ft\.?|sqft|square\s*feet)[:\s]*(\d{1,4}(?:,\d{3})*)/gi,

      // Patterns in parentheses or brackets
      /$$\s*(\d{1,4}(?:,\d{3})*)\s*(?:sq\.?\s*ft\.?|sqft|square\s*feet)\s*$$/gi,
      /\[\s*(\d{1,4}(?:,\d{3})*)\s*(?:sq\.?\s*ft\.?|sqft|square\s*feet)\s*\]/gi,

      // Real estate specific patterns
      /home\s*size[:\s]*(\d{1,4}(?:,\d{3})*)\s*(?:sq\.?\s*ft\.?|sqft)/gi,
      /living\s*space[:\s]*(\d{1,4}(?:,\d{3})*)\s*(?:sq\.?\s*ft\.?|sqft)/gi,
      /total\s*area[:\s]*(\d{1,4}(?:,\d{3})*)\s*(?:sq\.?\s*ft\.?|sqft)/gi,
    ]

    let foundSquareFootage = false
    for (const pattern of sqftPatterns) {
      const matches = Array.from(combinedText.matchAll(pattern))
      for (const match of matches) {
        let sqft: number

        // Handle patterns that capture two groups (thousands and hundreds)
        if (match[2]) {
          sqft = Number.parseInt(match[1] + match[2])
        } else {
          sqft = Number.parseInt(match[1].replace(/,/g, ""))
        }

        console.log(`Found potential square footage: ${sqft} (from pattern: ${pattern.source})`)
        console.log(`  Full match: "${match[0]}"`)

        // Validate reasonable square footage (500-15000 sq ft)
        if (sqft >= 500 && sqft <= 15000) {
          console.log(`✓ Valid square footage: ${sqft} from ${getDomainFromUrl(link)} (address match: ${addressMatch})`)

          foundData.push({
            squareFootage: sqft,
            source: getDomainFromUrl(link),
            title: title,
            snippet: snippet,
            link: link,
            addressMatch: addressMatch,
            confidence: calculateConfidence(link, title, snippet, targetAddress, addressMatch),
            reasoning: `Found ${sqft} sq ft on ${getDomainFromUrl(link)} with ${addressMatch} address match`,
            matchedText: match[0], // Include the actual matched text for debugging
            propertyType: extractPropertyType(title, snippet),
          })
          foundSquareFootage = true
        } else {
          console.log(`✗ Invalid square footage: ${sqft} (outside 500-15000 range)`)
        }
      }
    }

    if (!foundSquareFootage) {
      console.log(`No square footage found in this result`)
      // Log some of the text to help debug what we're missing
      console.log(`  Sample text: "${combinedText.substring(0, 300)}..."`)
    }
  }

  console.log(`\n=== SUMMARY ===`)
  console.log(`Total results analyzed: ${searchResults.length}`)
  console.log(`Square footage matches found: ${foundData.length}`)
  foundData.forEach((data, index) => {
    console.log(
      `Match ${index + 1}: ${data.squareFootage} sq ft from ${data.source} (${data.addressMatch} match) - "${data.matchedText}"`,
    )
  })

  return foundData
}

function calculateAddressMatch(text: string, targetAddress: string, addressParts: any): string {
  const textLower = text.toLowerCase()
  const targetLower = targetAddress.toLowerCase()

  console.log(`  Checking address match:`)
  console.log(`    Text: "${textLower.substring(0, 100)}..."`)
  console.log(`    Target: "${targetLower}"`)
  console.log(`    Street parts: ${addressParts.streetNumber} ${addressParts.streetName}`)

  // First, extract all numbers from the text to check for exact street number matches
  const numbersInText = textLower.match(/\b\d+\b/g) || []
  console.log(`    Numbers found in text: [${numbersInText.join(", ")}]`)

  // Check for exact street number match
  const hasExactStreetNumber = numbersInText.includes(addressParts.streetNumber)
  console.log(`    Exact street number (${addressParts.streetNumber}) found: ${hasExactStreetNumber}`)

  if (!hasExactStreetNumber) {
    console.log(`    ✗ No exact street number match - marking as 'none' but still processing`)
    return "none"
  }

  // Now check for street name match
  const streetNameWords = addressParts.streetName.split(" ").filter((word) => word.length > 2)
  const streetNameMatches = streetNameWords.filter((word) => textLower.includes(word))
  const streetNameMatchRatio = streetNameMatches.length / Math.max(streetNameWords.length, 1)

  console.log(`    Street name words: [${streetNameWords.join(", ")}]`)
  console.log(`    Street name matches: [${streetNameMatches.join(", ")}]`)
  console.log(`    Street name match ratio: ${streetNameMatchRatio}`)

  // Check for exact full address match first
  const fullAddressVariations = [
    targetLower,
    targetLower.replace(/,/g, ""),
    targetLower.replace(/,/g, " ").replace(/\s+/g, " "),
    `${addressParts.streetNumber} ${addressParts.streetName} ${addressParts.city} ${addressParts.state}`,
    `${addressParts.streetNumber} ${addressParts.streetName}, ${addressParts.city}, ${addressParts.state}`,
  ]

  for (const variation of fullAddressVariations) {
    if (textLower.includes(variation.trim())) {
      console.log(`    ✓ EXACT address match found with variation: "${variation}"`)
      return "exact"
    }
  }

  // Check for partial match (street number + most of street name + city)
  if (hasExactStreetNumber && streetNameMatchRatio >= 0.7) {
    if (addressParts.city && textLower.includes(addressParts.city)) {
      console.log(`    ✓ PARTIAL match: exact street number + street name + city`)
      return "partial"
    }

    // Check for state match if no city
    if (addressParts.state && textLower.includes(addressParts.state)) {
      console.log(`    ✓ PARTIAL match: exact street number + street name + state`)
      return "partial"
    }
  }

  // Check for general match (exact street number + some street name match)
  if (hasExactStreetNumber && streetNameMatchRatio >= 0.5) {
    console.log(`    ✓ GENERAL match: exact street number + partial street name`)
    return "general"
  }

  // If we have exact street number but poor street name match, it might be a different street
  if (hasExactStreetNumber && streetNameMatchRatio < 0.5) {
    console.log(`    ⚠ Street number matches but street name doesn't - likely different street`)
    return "none"
  }

  console.log(`    ✗ No sufficient address match found`)
  return "none"
}

function getDomainFromUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return domain.replace("www.", "")
  } catch {
    return "Unknown"
  }
}

function calculateConfidence(
  link: string,
  title: string,
  snippet: string,
  address: string,
  addressMatch: string,
): number {
  let confidence = 0.3 // Start higher

  // Boost confidence based on address match quality
  const matchBonus = { exact: 0.4, partial: 0.3, general: 0.2, none: 0.1 }
  confidence += matchBonus[addressMatch] || 0

  // Big boost for trusted real estate sites
  const trustedSites = ["zillow.com", "realtor.com", "redfin.com", "trulia.com", "homes.com"]
  if (trustedSites.some((site) => link.includes(site))) {
    confidence += 0.4 // Increased from 0.3
  }

  // Boost confidence for recent listings
  const textToCheck = `${title} ${snippet}`.toLowerCase()
  if (textToCheck.includes("sold") || textToCheck.includes("listing") || textToCheck.includes("for sale")) {
    confidence += 0.1
  }

  // Boost confidence for property details pages
  if (textToCheck.includes("property details") || textToCheck.includes("home details")) {
    confidence += 0.1
  }

  return Math.min(confidence, 1.0)
}

function extractPropertyType(title: string, snippet: string): string {
  const text = `${title} ${snippet}`.toLowerCase()

  if (text.includes("condo") || text.includes("condominium")) return "condo"
  if (text.includes("townhouse") || text.includes("townhome")) return "townhouse"
  if (text.includes("apartment") || text.includes("apt")) return "apartment"
  if (text.includes("single family") || text.includes("single-family")) return "single-family"
  if (text.includes("duplex")) return "duplex"
  if (text.includes("mobile home") || text.includes("manufactured")) return "mobile-home"

  return "single-family" // Default assumption
}
