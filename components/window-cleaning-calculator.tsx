"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertTriangle, Phone, ArrowRight, Home } from "lucide-react"
import { AddressAutocomplete } from "@/components/address-autocomplete"

// Add this right after the imports and before the component definition
if (typeof window !== "undefined") {
  // Client-side only code
}

// Define Service type based on your Supabase table schema
type Service = {
  id: string
  name: string
  description: string | null
  category: "main" | "addon" | "upsell"
  per_sqft_price: number | null
  flat_fee: number | null
  use_both_pricing: boolean
  minimum_price: number | null
  is_active: boolean
  display_order: number
}

// Story-based multipliers and flat fees remain hardcoded for now
const STORY_PRICING = {
  storyMultipliers: {
    1: 0,
    2: 0.02,
    3: 0.06,
  },
  storyFlatFees: {
    3: 300,
  },
}

export function WindowCleaningCalculator() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  // Settings state
  const [settings, setSettings] = useState<any>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)

  // Dynamic service pricing from database
  const [dynamicServices, setDynamicServices] = useState<Service[]>([])
  const [loadingServices, setLoadingServices] = useState(true)

  const [maxDistanceMiles, setMaxDistanceMiles] = useState(20)
  const [outsideAreaMessage, setOutsideAreaMessage] = useState(
    "We're sorry, but your location is outside our typical service area. Please provide your contact information below and we'll call you to see if we can make an exception for your location.",
  )

  // Form step state
  const [formStep, setFormStep] = useState(1)

  // Loading and error states
  const [error, setError] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [showEstimateNeededMessage, setShowEstimateNeededMessage] = useState(false) // New state for conditional message

  // Property data states
  const [propertyData, setPropertyData] = useState<any>(null)
  const [isOutsideServiceArea, setIsOutsideServiceArea] = useState(false)
  const [outsideAreaDistance, setOutsideAreaDistance] = useState(0)
  const [showManualEntry, setShowManualEntry] = useState(false)

  // Step 1 form fields
  const [address, setAddress] = useState("")
  const [stories, setStories] = useState("")
  const [manualSquareFootage, setManualSquareFootage] = useState("")

  // Step 2 form fields
  const [serviceType, setServiceType] = useState("Exterior Only Cleaning") // Set default to exterior only
  const [screenCleaning, setScreenCleaning] = useState(false)
  const [trackCleaning, setTrackCleaning] = useState(false)
  const [skylights, setSkylights] = useState(false)
  // New window detail fields
  const [isPostConstruction, setIsPostConstruction] = useState(false)
  const [gridType, setGridType] = useState<"none" | "between-panes" | "on-surface" | "">("")
  const [upperWindowsOpenInside, setUpperWindowsOpenInside] = useState(false)
  const [panesPerWindow, setPanesPerWindow] = useState("")
  const [windowManufacturer, setWindowManufacturer] = useState("")

  // Step 3 form fields (additional services) - replace pressureWashing with subcategories
  const [homeWashing, setHomeWashing] = useState(false)
  const [roofWashing, setRoofWashing] = useState(false)
  const [drivewayWashing, setDrivewayWashing] = useState(false)
  const [fenceDeckWashing, setFenceDeckWashing] = useState(false)
  const [otherPressureWashing, setOtherPressureWashing] = useState(false)
  const [gutterCleaning, setGutterCleaning] = useState(false)
  const [specialtyCleaning, setSpecialtyCleaning] = useState(false)

  // Contact information
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")

  // Quote data
  const [currentQuote, setCurrentQuote] = useState<any>(null)
  const [runningTotal, setRunningTotal] = useState(0)
  const [quoteBreakdown, setQuoteBreakdown] = useState<any>(null)

  const [step3EmailTimer, setStep3EmailTimer] = useState<NodeJS.Timeout | null>(null)
  const [currentQuoteId, setCurrentQuoteId] = useState<string | null>(null)

  // Helper to calculate cost for a single service/addon, applying pricing model and story adjustments
  const _calculateSingleServiceCost = useCallback(
    (service: Service, sqft: number, currentStories: number | null = null) => {
      let perSqftRate = 0
      let flatFee = 0

      if (service.use_both_pricing) {
        perSqftRate = service.per_sqft_price || 0
        flatFee = service.flat_fee || 0
      } else {
        if (service.per_sqft_price !== null) {
          perSqftRate = service.per_sqft_price
        } else if (service.flat_fee !== null) {
          flatFee = service.flat_fee
        }
      }

      // Apply story multiplier only if it's a main service and stories are provided
      if (service.category === "main" && currentStories !== null && settings?.story_multipliers) {
        const storyMultiplier = settings.story_multipliers[currentStories.toString()] || 0
        perSqftRate += storyMultiplier
      }

      let cost = perSqftRate * sqft + flatFee

      // Apply story flat fee only for main services
      if (service.category === "main" && currentStories !== null && settings?.story_flat_fees) {
        const storyFlatFee = settings.story_flat_fees[currentStories.toString()] || 0
        cost += storyFlatFee
      }

      return cost
    },
    [settings],
  )

  // Helper function to get discount multiplier and type
  const getDiscountInfo = useCallback(() => {
    if (!settings?.discount_enabled) return { multiplier: 1, type: "none", percentage: 0 }

    const discountPercentage = settings?.discount_percentage || 15
    const discountType = settings?.discount_type || "visual_only"

    console.log("Discount settings:", { discountType, discountPercentage }) // Debug log

    if (discountType === "actual") {
      // Actual discount: reduce the final price
      return {
        multiplier: 1 - discountPercentage / 100,
        type: "actual",
        percentage: discountPercentage,
      }
    } else {
      // Visual only: markup the "original" price
      return {
        multiplier: 1 / (1 - discountPercentage / 100),
        type: "visual_only",
        percentage: discountPercentage,
      }
    }
  }, [settings])

  // Function to fetch services from the API
  const fetchServices = useCallback(async () => {
    setLoadingServices(true)
    try {
      const response = await fetch("/api/services", {
        cache: "no-store",
      })
      const result = await response.json()
      if (result.success) {
        setDynamicServices(result.data || [])
        console.log("Fetched dynamic services:", result.data) // Debugging log
      } else {
        console.error("Failed to fetch services:", result.message)
      }
    } catch (error) {
      console.error("Error fetching services:", error)
    } finally {
      setLoadingServices(false)
    }
  }, [])

  // Helper function to calculate pricing based on dynamic services
  const calculatePricing = useCallback(
    (
      squareFootage: number,
      selectedServiceType: string, // e.g., "Interior & Exterior Cleaning"
      stories: number,
      selectedAddons: string[], // e.g., ["Screen Cleaning", "Track Cleaning"]
      availableServices: Service[],
      isPostConstructionJob: boolean, // New parameter
    ) => {
      console.log("--- calculatePricing called ---")
      console.log("squareFootage:", squareFootage)
      console.log("selectedServiceType:", selectedServiceType)
      console.log("stories:", stories)
      console.log("selectedAddons:", selectedAddons)
      console.log("availableServices (inside calc):", availableServices)
      console.log("isPostConstructionJob:", isPostConstructionJob)

      if (!availableServices || availableServices.length === 0) {
        console.log("No available services for calculation.")
        return { finalPrice: 0, breakdown: {} }
      }

      const mainService = availableServices.find(
        (s) => s.name === selectedServiceType && s.category === "main" && s.is_active,
      )

      console.log("mainService found:", mainService)

      if (!mainService) {
        console.log("Main service not found or inactive for calculation.")
        return { finalPrice: 0, breakdown: {} }
      }

      console.log("mainService.per_sqft_price:", mainService.per_sqft_price)
      console.log("mainService.flat_fee:", mainService.flat_fee)
      console.log("mainService.use_both_pricing:", mainService.use_both_pricing)
      console.log("mainService.minimum_price:", mainService.minimum_price)

      let totalCost = _calculateSingleServiceCost(mainService, squareFootage, stories)
      console.log("totalCost (after main service and story adjustments):", totalCost)

      // Apply post-construction markup if applicable
      if (isPostConstructionJob && settings?.post_construction_markup_percentage !== undefined) {
        const markupMultiplier = 1 + settings.post_construction_markup_percentage / 100
        totalCost *= markupMultiplier
        console.log(`Applied post-construction markup (${settings.post_construction_markup_percentage}%):`, totalCost)
      }

      const addonCalculations: string[] = []

      selectedAddons.forEach((addonName) => {
        const addonService = availableServices.find(
          (s) => s.name === addonName && s.category === "addon" && s.is_active,
        )

        if (addonService) {
          const addonCost = _calculateSingleServiceCost(addonService, squareFootage)
          totalCost += addonCost
          addonCalculations.push(`${addonService.name}: ${formatCurrency(addonCost)}`)
        }
      })
      console.log("totalCost (after addons):", totalCost)

      const finalPrice = Math.max(totalCost, mainService.minimum_price || 0)
      console.log("finalPrice:", finalPrice)

      const breakdown = {
        squareFootage,
        mainService, // Include the full service object for debugging
        storyMultiplier: settings?.story_multipliers?.[stories.toString()] || 0,
        storyFlatFee: settings?.story_flat_fees?.[stories.toString()] || 0,
        addons: selectedAddons,
        totalBeforeMinimum: totalCost,
        minimum: mainService.minimum_price,
        finalPrice: Math.round(finalPrice),
        calculations: {
          mainServiceCalculation: (() => {
            let desc = ""
            const mainServicePerSqft = mainService.per_sqft_price || 0
            const mainServiceFlat = mainService.flat_fee || 0
            const storyMult = settings?.story_multipliers?.[stories.toString()] || 0
            const storyFlat = settings?.story_flat_fees?.[stories.toString()] || 0

            if (mainService.use_both_pricing) {
              desc += `${squareFootage} sq ft × ${formatCurrency(mainServicePerSqft + storyMult)}/sq ft = ${formatCurrency((mainServicePerSqft + storyMult) * squareFootage)}`
              if (mainServiceFlat > 0 || storyFlat > 0) {
                desc += ` + Flat Fee: ${formatCurrency(mainServiceFlat + storyFlat)}`
              }
            } else {
              if (mainServicePerSqft !== null && mainServicePerSqft > 0) {
                desc += `${squareFootage} sq ft × ${formatCurrency(mainServicePerSqft + storyMult)}/sq ft = ${formatCurrency((mainServicePerSqft + storyMult) * squareFootage)}`
                if (storyFlat > 0) {
                  desc += ` + Story Flat Fee: ${formatCurrency(storyFlat)}`
                }
              } else if (mainServiceFlat !== null && mainServiceFlat > 0) {
                desc += `Flat Fee: ${formatCurrency(mainServiceFlat + storyFlat)}`
              }
            }
            return desc
          })(),
          addonCalculations,
          minimumApplied:
            finalPrice > totalCost ? `Minimum of ${formatCurrency(mainService.minimum_price || 0)} applied` : null,
        },
      }
      console.log("--- calculatePricing finished ---")
      return breakdown
    },
    [_calculateSingleServiceCost, settings], // Dependency for useCallback
  )

  // Load settings and services on component mount
  useEffect(() => {
    async function loadInitialData() {
      setLoadingSettings(true)
      await fetchServices() // Fetch services first
      try {
        const response = await fetch("/api/settings?" + new Date().getTime(), {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })
        const result = await response.json()

        if (result.success) {
          setSettings(result.data)
          setMaxDistanceMiles(result.data.service_radius_miles || 20)
          setOutsideAreaMessage(
            result.data.outside_area_message ||
              "We're sorry, but your location is outside our typical service area. Please provide your contact information below and we'll call you to see if we can make an exception for your location.",
          )
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
      } finally {
        setLoadingSettings(false)
      }
    }

    loadInitialData()
  }, [fetchServices])

  useEffect(() => {
    // Listen for settings updates from other windows/tabs
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "SETTINGS_UPDATED") {
        console.log("Received settings update message") // Debug log

        // Force a reload of settings from the API to get the latest data
        fetch("/api/settings?" + new Date().getTime(), {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })
          .then((response) => response.json())
          .then((result) => {
            if (result.success) {
              console.log("Updated settings:", result.data) // Debug log
              setSettings(result.data)
              setMaxDistanceMiles(result.data.service_radius_miles || 20)
              setOutsideAreaMessage(
                result.data.outside_area_message ||
                  "We're sorry, but your location is outside our typical service area. Please provide your contact information below and we'll call you to see if we can make an exception for your location.",
              )

              // Recalculate running total with new settings
              if (formStep >= 2 && propertyData && serviceType && stories && !loadingServices) {
                const squareFootage =
                  propertyData.estimatedSquareFootage ||
                  (manualSquareFootage ? Number.parseInt(manualSquareFootage.replace(/,/g, ""), 10) : 0)

                if (squareFootage > 0) {
                  const addonNames: string[] = []
                  if (screenCleaning) addonNames.push("Screen Cleaning")
                  if (trackCleaning) addonNames.push("Track Cleaning")

                  const quote = calculatePricing(
                    squareFootage,
                    serviceType,
                    Number.parseInt(stories),
                    addonNames,
                    dynamicServices,
                    isPostConstruction, // Pass post-construction status
                  )

                  // Calculate discount inline
                  let finalPrice = quote.finalPrice
                  if (result.data?.discount_enabled && result.data?.discount_type === "actual") {
                    const discountPercentage = result.data?.discount_percentage || 15
                    finalPrice = Math.round(quote.finalPrice * (1 - discountPercentage / 100))
                  }

                  setRunningTotal(finalPrice)
                  setQuoteBreakdown({ ...quote, finalPrice })
                }
              }
            }
          })
          .catch((error) => {
            console.error("Failed to reload settings:", error)
          })
      } else if (event.data.type === "SERVICES_UPDATED") {
        // Re-fetch services when notified of updates
        fetchServices()
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [
    fetchServices,
    formStep,
    propertyData,
    serviceType,
    stories,
    screenCleaning,
    trackCleaning,
    manualSquareFootage,
    dynamicServices,
    loadingServices,
    settings,
    calculatePricing,
    isPostConstruction, // Add as dependency
  ])

  // Replace the existing saveIncompleteQuote function with this improved version:

  const saveIncompleteQuote = async (step: number) => {
    try {
      // Only save if we have at least name and email
      if (!customerName || !customerEmail) {
        console.log("⏭️ Skipping incomplete quote save - missing required fields")
        return
      }

      const squareFootage =
        propertyData?.estimatedSquareFootage ||
        (manualSquareFootage ? Number.parseInt(manualSquareFootage.replace(/,/g, ""), 10) : null)

      const incompleteData = {
        customer_name: customerName || null,
        customer_email: customerEmail || null,
        customer_phone: customerPhone || null,
        address: address || null,
        stories: stories ? Number.parseInt(stories) : null,
        service_type: serviceType || null,
        square_footage: squareFootage,
        addons: [...(screenCleaning ? ["Screen Cleaning"] : []), ...(trackCleaning ? ["Track Cleaning"] : [])],
        has_skylights: skylights,
        additional_services: {
          homeWashing,
          roofWashing,
          drivewayWashing,
          fenceDeckWashing,
          otherPressureWashing,
          gutterCleaning,
          specialtyCleaning,
        },
        last_step_completed: step,
        status: "incomplete",
        distance: propertyData?.distance || null,
        final_price: runningTotal || 0,
        quote_data: {
          formStep: step,
          timestamp: new Date().toISOString(),
          propertyData: propertyData || null,
          runningTotal: runningTotal || 0,
          quoteBreakdown: quoteBreakdown || null,
          progress: {
            step1_completed: step >= 1,
            step2_completed: step >= 2,
            step3_completed: step >= 3,
            step4_completed: step >= 4, // Final submission
          },
          // New window detail fields
          isPostConstruction,
          gridType,
          upperWindowsOpenInside,
          panesPerWindow,
          windowManufacturer,
        },
        existing_quote_id: currentQuoteId,
        // Removed session_identifier here to ensure updates rely on existing_quote_id
      }

      console.log(`💾 Saving incomplete quote for step ${step}/4:`, {
        email: incompleteData.customer_email,
        step: step,
        existing_id: currentQuoteId,
      })

      const response = await fetch("/api/quotes/incomplete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(incompleteData),
      })

      const result = await response.json()

      if (result.success) {
        // Always update the current quote ID to ensure we keep updating the same record
        if (!currentQuoteId || result.action === "created") {
          setCurrentQuoteId(result.id)
        }
        console.log(`✅ Incomplete quote saved/updated: ${result.id} (${result.action})`)
      } else {
        console.error("❌ Failed to save incomplete quote:", result.message)
      }
    } catch (error) {
      console.error("❌ Error saving incomplete quote:", error)
    }
  }

  // Helper function to get final discounted price
  const _getFinalPrice = useCallback(
    (calculatedPrice: number) => {
      const discountInfo = getDiscountInfo()
      console.log("Applying discount:", {
        calculatedPrice,
        discountType: discountInfo.type,
        multiplier: discountInfo.multiplier,
      }) // Debug log

      if (discountInfo.type === "actual") {
        return Math.round(calculatedPrice * discountInfo.multiplier)
      }
      return calculatedPrice // For visual discounts, return the original calculated price
    },
    [getDiscountInfo],
  )

  // Calculate running total whenever relevant inputs change
  useEffect(() => {
    if (formStep >= 2 && propertyData && serviceType && stories && !loadingServices && settings) {
      const squareFootage =
        propertyData.estimatedSquareFootage ||
        (manualSquareFootage ? Number.parseInt(manualSquareFootage.replace(/,/g, ""), 10) : 0)

      if (squareFootage > 0) {
        const addonNames: string[] = []
        if (screenCleaning) addonNames.push("Screen Cleaning")
        if (trackCleaning) addonNames.push("Track Cleaning")

        const quote = calculatePricing(
          squareFootage,
          serviceType,
          Number.parseInt(stories),
          addonNames,
          dynamicServices,
          isPostConstruction, // Pass post-construction status
        )

        // Calculate discount inline to avoid circular dependency
        let finalPrice = quote.finalPrice
        if (settings?.discount_enabled && settings?.discount_type === "actual") {
          const discountPercentage = settings?.discount_percentage || 15
          finalPrice = Math.round(quote.finalPrice * (1 - discountPercentage / 100))
        }

        setRunningTotal(finalPrice)
        setQuoteBreakdown({ ...quote, finalPrice })
      }
    }
  }, [
    formStep,
    propertyData,
    serviceType,
    stories,
    screenCleaning,
    trackCleaning,
    manualSquareFootage,
    dynamicServices,
    loadingServices,
    settings,
    calculatePricing,
    isPostConstruction, // Add as dependency
  ])

  // Save incomplete quote when moving between steps (silent)
  useEffect(() => {
    if (formStep > 1 && customerName && customerEmail) {
      saveIncompleteQuote(formStep - 1) // Save the completed step, not the current step
    }
  }, [
    formStep,
    customerName,
    customerEmail,
    customerPhone,
    address,
    serviceType,
    stories,
    isPostConstruction,
    gridType,
    upperWindowsOpenInside,
    panesPerWindow,
    windowManufacturer,
  ])

  // Handle step 3 email notification
  useEffect(() => {
    if (step3EmailTimer) {
      clearTimeout(step3EmailTimer)
      setStep3EmailTimer(null)
    }

    if (
      formStep === 3 &&
      customerName.trim() &&
      customerEmail.trim() &&
      customerPhone.trim() &&
      propertyData &&
      serviceType &&
      stories &&
      !loadingServices
    ) {
      const timer = setTimeout(
        async () => {
          try {
            const squareFootage =
              propertyData.estimatedSquareFootage ||
              (manualSquareFootage ? Number.parseInt(manualSquareFootage.replace(/,/g, ""), 10) : 0)

            const addonNames: string[] = []
            if (screenCleaning) addonNames.push("Screen Cleaning")
            if (trackCleaning) addonNames.push("Track Cleaning")

            const quote = calculatePricing(
              squareFootage,
              serviceType,
              Number.parseInt(stories),
              addonNames,
              dynamicServices,
              isPostConstruction, // Pass post-construction status
            )

            const partialQuoteData = {
              ...quote,
              address,
              serviceType,
              stories: Number.parseInt(stories),
              addons: addonNames, // Ensure addons are full names here too
              squareFootage,
              customerName,
              customerEmail,
              customerPhone,
              hasSkylights: skylights,
              additionalServices: {
                homeWashing,
                roofWashing,
                drivewayWashing,
                fenceDeckWashing,
                otherPressureWashing,
                gutterCleaning,
                specialtyCleaning,
              },
              // New window detail fields
              isPostConstruction,
              gridType,
              upperWindowsOpenInside,
              panesPerWindow,
              windowManufacturer,
              isPartialQuote: true,
              timeOnStep3: "4+ minutes",
            }

            if (propertyData?.distance) {
              partialQuoteData.distance = propertyData.distance
            }

            await fetch("/api/send-step3-notification", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ quoteData: partialQuoteData }),
            })
          } catch (error) {
            // Silent failure
          }
        },
        4 * 60 * 1000,
      )

      setStep3EmailTimer(timer)
    }
  }, [
    formStep,
    customerName,
    customerEmail,
    customerPhone,
    propertyData,
    serviceType,
    stories,
    screenCleaning,
    trackCleaning,
    skylights,
    homeWashing,
    roofWashing,
    drivewayWashing,
    fenceDeckWashing,
    otherPressureWashing,
    gutterCleaning,
    specialtyCleaning,
    address,
    manualSquareFootage,
    dynamicServices,
    loadingServices,
    calculatePricing,
    isPostConstruction,
    gridType,
    upperWindowsOpenInside,
    panesPerWindow,
    windowManufacturer,
  ])

  // Story-specific loading messages
  const getLoadingMessages = () => {
    const commonMessages = [
      "Reviewing property details...",
      "Calculating cleaning time...",
      "Checking for screens and tracks...",
      "Finalizing your custom quote...",
    ]

    switch (stories) {
      case "1":
        return [
          "Walking around your single-story property...",
          "Counting ground floor windows...",
          "Measuring window sizes...",
          "Checking window accessibility...",
          ...commonMessages,
        ]
      case "2":
        return [
          "Walking around your two-story property...",
          "Counting first floor windows...",
          "Counting second floor windows...",
          "Setting up our extension ladders...",
          "Measuring window heights...",
          ...commonMessages,
        ]
      case "3":
        return [
          "Walking around your three-story property...",
          "Counting windows on all three floors...",
          "Setting up our tallest ladders...",
          "Calculating extra height requirements...",
          "Measuring those high windows...",
          ...commonMessages,
        ]
      default:
        return [
          "Walking around your property...",
          "Counting windows...",
          "Measuring window sizes...",
          "Assessing window accessibility...",
          ...commonMessages,
        ]
    }
  }

  // Handle step 1 submission (address and stories)
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address || !stories || !customerName || !customerEmail) {
      setError("Please fill in all required fields.")
      return
    }

    setLoading(true)
    setError("")
    setIsOutsideServiceArea(false)

    const loadingMessages = getLoadingMessages()
    let messageIndex = 0
    setLoadingMessage(loadingMessages[0])

    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length
      setLoadingMessage(loadingMessages[messageIndex])
    }, 1200)

    try {
      let distance = 9999

      try {
        const distanceResponse = await fetch("/api/calculate-distance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ address }),
        })

        const distanceData = await distanceResponse.json()

        if (distanceData.success) {
          distance = distanceData.distance
        }
      } catch (distErr) {
        distance = 9999
      }

      if (distance > maxDistanceMiles) {
        clearInterval(messageInterval)
        setIsOutsideServiceArea(true)
        setOutsideAreaDistance(distance)

        setError(
          `${outsideAreaMessage.replace("typical service area", `typical ${maxDistanceMiles}-mile service area`)}`,
        )
        setLoading(false)
        return
      }

      const propertyResponse = await fetch("/api/get-square-footage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address }),
      })

      const propertyData = await propertyResponse.json()

      if (!propertyData.success) {
        clearInterval(messageInterval)
        setError(propertyData.error || "Unable to find property data for this address")

        if (propertyData.needsManualEntry) {
          setShowManualEntry(true)
        }

        setLoading(false)
        return
      }

      setPropertyData({
        ...propertyData.data,
        distance: distance,
      })

      setFormStep(2)
      // Update the handleStep1Submit function to save immediately after step 1:

      // In handleStep1Submit, after setFormStep(2), add:
      // Save incomplete quote immediately after step 1 completion
      setTimeout(async () => {
        await saveIncompleteQuote(1)
      }, 100) // Small delay to ensure state is updated
    } catch (err) {
      setError("Unable to process your address. Please check and try again.")
      setShowManualEntry(true)
    } finally {
      clearInterval(messageInterval)
      setLoading(false)
    }
  }

  // Handle manual square footage submission
  const handleManualSquareFootageSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!manualSquareFootage) {
      setError("Please enter your home's square footage.")
      return
    }

    const sqft = Number.parseInt(manualSquareFootage.replace(/,/g, ""), 10)

    if (isNaN(sqft) || sqft < 500 || sqft > 15000) {
      setError("Please enter a valid square footage between 500 and 15,000")
      return
    }

    setPropertyData({
      estimatedSquareFootage: sqft,
      source: "Manual entry",
      confidence: 1.0,
    })

    setFormStep(2)
  }

  // Handle final quote submission
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step3EmailTimer) {
      clearTimeout(step3EmailTimer)
      setStep3EmailTimer(null)
    }

    setLoading(true)
    setShowEstimateNeededMessage(false) // Reset message state

    try {
      const squareFootage =
        propertyData.estimatedSquareFootage ||
        (manualSquareFootage ? Number.parseInt(manualSquareFootage.replace(/,/g, ""), 10) : 0)

      const addons = []
      if (screenCleaning) addons.push("Screen Cleaning")
      if (trackCleaning) addons.push("Track Cleaning")

      const quote = calculatePricing(
        squareFootage,
        serviceType,
        Number.parseInt(stories),
        addons,
        dynamicServices,
        isPostConstruction, // Pass post-construction status
      )

      const finalQuote = {
        ...quote,
        address,
        serviceType,
        stories: Number.parseInt(stories),
        addons,
        squareFootage,
        customerName,
        customerEmail,
        customerPhone,
        hasSkylights: skylights,
        additionalServices: {
          homeWashing,
          roofWashing,
          drivewayWashing,
          fenceDeckWashing,
          otherPressureWashing,
          gutterCleaning,
          specialtyCleaning,
        },
        status: "submitted",
        // Add original price for discount display
        originalPrice: getOriginalPriceForDisplay(quote.finalPrice),
        // New window detail fields
        isPostConstruction,
        gridType,
        upperWindowsOpenInside,
        panesPerWindow,
        windowManufacturer,
      }

      if (propertyData?.distance) {
        finalQuote.distance = propertyData.distance
      }

      setCurrentQuote(finalQuote)

      const quoteDataForDB = {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        address,
        stories: Number.parseInt(stories),
        service_type: serviceType,
        square_footage: squareFootage,
        addons,
        has_skylights: skylights,
        additional_services: {
          homeWashing,
          roofWashing,
          drivewayWashing,
          fenceDeckWashing,
          otherPressureWashing,
          gutterCleaning,
          specialtyCleaning,
        },
        final_price: quote.finalPrice,
        quote_data: finalQuote,
        status: "submitted",
        last_step_completed: 4,
        existing_quote_id: currentQuoteId, // Make sure this is included
      }

      // Determine if estimate needed message should be shown
      const currentStoriesNum = Number.parseInt(stories)
      if (
        isPostConstruction ||
        gridType !== "none" ||
        (currentStoriesNum > 1 && !upperWindowsOpenInside) ||
        panesPerWindow === "3+" ||
        panesPerWindow === "unknown" ||
        windowManufacturer.trim() !== ""
      ) {
        setShowEstimateNeededMessage(true)
      }

      // Save the final quote to database
      console.log("🚀 Attempting to save final quote:", quoteDataForDB)

      const saveResponse = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quoteDataForDB),
      })

      console.log("📡 Save response status:", saveResponse.status)

      const saveResult = await saveResponse.json()
      console.log("💾 Final quote save result:", saveResult)

      if (!saveResult.success) {
        console.error("❌ Failed to save final quote:", saveResult.message)
        // Don't throw error - still show success to customer but log the issue
        console.error("❌ Full error details:", saveResult)
      } else {
        console.log("✅ Final quote saved successfully:", saveResult.id)
      }

      // Send emails (silent)
      console.log("🚀 Attempting to send emails for quote:", {
        customerName: finalQuote.customerName,
        customerEmail: finalQuote.customerEmail,
        finalPrice: finalQuote.finalPrice,
      })

      try {
        const emailResponse = await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quoteData: finalQuote }),
        })

        const emailResult = await emailResponse.json()
        console.log("📧 Email API response:", {
          status: emailResponse.status,
          success: emailResult.success,
          message: emailResult.message,
          details: emailResult.details,
        })

        if (!emailResponse.ok || !emailResult.success) {
          console.error("❌ Email sending failed:", emailResult)
        } else {
          console.log("✅ Emails sent successfully")
        }
      } catch (emailError) {
        console.error("💥 Email sending error:", emailError)
        // Don't fail the submission if email fails
      }

      setShowSuccess(true)
    } catch (err) {
      console.error("Final submission error:", err)
      setShowSuccess(true) // Always show success to customer
    } finally {
      setLoading(false)
    }
  }

  // Reset the form
  const resetForm = () => {
    if (step3EmailTimer) {
      clearTimeout(step3EmailTimer)
      setStep3EmailTimer(null)
    }

    // Reset all form state
    setFormStep(1)
    setAddress("")
    setStories("")
    setServiceType("Exterior Only Cleaning")
    setScreenCleaning(false)
    setTrackCleaning(false)
    setSkylights(false)
    setHomeWashing(false)
    setRoofWashing(false)
    setDrivewayWashing(false)
    setFenceDeckWashing(false)
    setOtherPressureWashing(false)
    setGutterCleaning(false)
    setSpecialtyCleaning(false)
    setCustomerName("")
    setCustomerEmail("")
    setCustomerPhone("")
    setManualSquareFootage("")
    // Reset new window detail fields
    setIsPostConstruction(false)
    setGridType("")
    setUpperWindowsOpenInside(false)
    setPanesPerWindow("")
    setWindowManufacturer("")

    // Reset UI state
    setShowManualEntry(false)
    setIsOutsideServiceArea(false)
    setOutsideAreaDistance(0)
    setShowSuccess(false) // Add this line
    setLoading(false) // Add this line
    setError("") // Reset error state
    setShowEstimateNeededMessage(false) // Reset new message state

    // Reset data state
    setPropertyData(null)
    setCurrentQuote(null)
    setRunningTotal(0)
    setQuoteBreakdown(null)
    setCurrentQuoteId(null)
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Helper function to get service cost for display
  const getServiceCostDisplay = (serviceName: string) => {
    if (!propertyData || !stories || loadingServices) return 0

    const squareFootage =
      propertyData.estimatedSquareFootage ||
      (manualSquareFootage ? Number.parseInt(manualSquareFootage.replace(/,/g, ""), 10) : 0)

    if (squareFootage === 0) return 0

    const service = dynamicServices.find((s) => s.name === serviceName && s.category === "main" && s.is_active)
    if (!service) return 0

    return _calculateSingleServiceCost(service, squareFootage, Number.parseInt(stories))
  }

  // Helper function to get addon cost for display
  const getAddonCostDisplay = (addonName: string) => {
    if (!propertyData || loadingServices) return 0

    const squareFootage =
      propertyData.estimatedSquareFootage ||
      (manualSquareFootage ? Number.parseInt(manualSquareFootage.replace(/,/g, ""), 10) : 0)

    if (squareFootage === 0) return 0

    const addonService = dynamicServices.find((s) => s.name === addonName && s.category === "addon" && s.is_active)
    if (!addonService) return 0

    return _calculateSingleServiceCost(addonService, squareFootage)
  }

  // Helper function to get marked-up service cost for display (visual discount)
  const getMarkedUpServiceCost = (serviceName: string) => {
    const actualCost = getServiceCostDisplay(serviceName)
    const discountInfo = getDiscountInfo()

    if (discountInfo.type === "visual_only") {
      return Math.round(actualCost * discountInfo.multiplier)
    }
    return actualCost // For actual discounts, show the original calculated price
  }

  // Helper function to get marked-up addon cost for display (visual discount)
  const getMarkedUpAddonCost = (addonName: string) => {
    const actualCost = getAddonCostDisplay(addonName)
    const discountInfo = getDiscountInfo()

    if (discountInfo.type === "visual_only") {
      return Math.round(actualCost * discountInfo.multiplier)
    }
    return actualCost // For actual discounts, show the original calculated price
  }

  // Helper function to get final discounted price
  const getOriginalPriceForDisplay = (finalPrice: number) => {
    const discountInfo = getDiscountInfo()

    if (discountInfo.type === "actual") {
      return Math.round(finalPrice / discountInfo.multiplier)
    } else if (discountInfo.type === "visual_only") {
      return Math.round(finalPrice * discountInfo.multiplier)
    }
    return finalPrice
  }

  // Helper function to get final discounted price for display
  const getFinalPrice = (calculatedPrice: number) => {
    const discountInfo = getDiscountInfo()

    if (discountInfo.type === "actual") {
      return Math.round(calculatedPrice * discountInfo.multiplier)
    }
    return calculatedPrice // For visual discounts, return the original calculated price
  }

  useEffect(() => {
    // Auto-save incomplete quote when important fields change
    if (formStep > 1) {
      // Only attempt to save if past step 1
      const timeoutId = setTimeout(() => {
        saveIncompleteQuote(formStep)
      }, 2000) // Debounce for 2 seconds

      return () => clearTimeout(timeoutId)
    }
  }, [
    serviceType,
    screenCleaning,
    trackCleaning,
    skylights,
    homeWashing,
    roofWashing,
    drivewayWashing,
    fenceDeckWashing,
    otherPressureWashing,
    gutterCleaning,
    specialtyCleaning,
    formStep,
    customerName,
    customerEmail,
    customerPhone,
    address,
    stories,
    manualSquareFootage,
    propertyData,
    runningTotal,
    quoteBreakdown,
    currentQuoteId, // Keep this as a dependency
    // Add new dependencies for auto-save
    isPostConstruction,
    gridType,
    upperWindowsOpenInside,
    panesPerWindow,
    windowManufacturer,
  ])

  if (loadingSettings || loadingServices) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-2 sm:p-4 lg:p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Render the appropriate form step
  const renderFormStep = () => {
    if (showSuccess) {
      return (
        <div className="text-center py-6 sm:py-8">
          <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-[#3695bb] mx-auto mb-4" />
          <h3 className="text-xl sm:text-2xl font-bold mb-2 text-black">
            {isOutsideServiceArea ? "Information Received!" : "Quote Accepted!"}
          </h3>
          <p className="text-slate-600 mb-6 text-sm sm:text-base px-4">
            Thank you for choosing {settings?.business_name || "our window cleaning service"}. Someone from our team
            will contact you within 24 hours to{" "}
            {isOutsideServiceArea ? "discuss availability and pricing" : "schedule your service"}.
          </p>

          {showEstimateNeededMessage && (
            <div className="mt-6 p-4 sm:p-6 bg-yellow-50 border border-yellow-300 rounded-lg text-yellow-800 text-left">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                <h4 className="font-semibold text-base sm:text-lg">Important Note Regarding Your Quote:</h4>
              </div>
              <p className="text-sm sm:text-base">
                One or more of your answers may indicate that this quote may need to be edited before booking. Someone
                on our team will reach out to schedule an in-person estimate to finalize your pricing.
              </p>
            </div>
          )}

          <Button
            variant="outline"
            onClick={resetForm}
            className="border-[#3695bb] text-[#3695bb] hover:bg-[#3695bb] hover:text-white text-sm sm:text-base mt-6"
          >
            Submit Another Quote
          </Button>
        </div>
      )
    }

    if (isOutsideServiceArea) {
      const handleOutsideAreaSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        setLoading(true)
        setError("")

        try {
          // Basic validation
          if (!customerName || !customerEmail || !customerPhone) {
            setError("Please fill in all required contact information.")
            setLoading(false)
            return
          }

          const squareFootage =
            propertyData?.estimatedSquareFootage ||
            (manualSquareFootage ? Number.parseInt(manualSquareFootage.replace(/,/g, ""), 10) : null)

          const outsideAreaSubmission = {
            customer_name: customerName || null,
            customer_email: customerEmail || null,
            customer_phone: customerPhone || null,
            address: address || null,
            stories: stories ? Number.parseInt(stories) : null,
            service_type: serviceType || null,
            square_footage: squareFootage,
            addons: [...(screenCleaning ? ["Screen Cleaning"] : []), ...(trackCleaning ? ["Track Cleaning"] : [])],
            has_skylights: skylights,
            additional_services: {
              homeWashing,
              roofWashing,
              drivewayWashing,
              fenceDeckWashing,
              otherPressureWashing,
              gutterCleaning,
              specialtyCleaning,
            },
            status: "outside_area",
            distance: propertyData?.distance || null,
            final_price: runningTotal || 0,
            quote_data: {
              formStep: formStep,
              timestamp: new Date().toISOString(),
              propertyData: propertyData || null,
              runningTotal: runningTotal || 0,
              quoteBreakdown: quoteBreakdown || null,
              progress: {
                step1_completed: true,
                step2_completed: formStep >= 2,
                step3_completed: formStep >= 3,
                step4_completed: true, // Consider this step completed
              },
              // New window detail fields
              isPostConstruction,
              gridType,
              upperWindowsOpenInside,
              panesPerWindow,
              windowManufacturer,
            },
            existing_quote_id: currentQuoteId,
          }

          // Send the data to your API endpoint
          const response = await fetch("/api/quotes/outside-area", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(outsideAreaSubmission),
          })

          const result = await response.json()

          if (result.success) {
            setShowSuccess(true)
          } else {
            setError(result.message || "Failed to submit your information. Please try again.")
          }
        } catch (err) {
          setError("An unexpected error occurred. Please try again.")
        } finally {
          setLoading(false)
        }
      }

      return (
        <form onSubmit={handleOutsideAreaSubmit} className="space-y-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 sm:p-6 text-center mb-6">
            <Phone className="h-8 w-8 text-orange-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-orange-800 mb-2">Outside Service Area</h3>
            <p className="text-sm text-orange-700 mb-4">
              We'll review your location and contact you within 24 hours to discuss availability and pricing.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Your Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email Address *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <h3 className="text-lg font-semibold">Additional Services Needed?</h3>
              <p className="text-sm text-slate-600">Let us know if you're interested in any of these services:</p>

              <div className="space-y-3">
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium text-sm mb-2">Pressure Washing Services</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="homeWashing"
                        checked={homeWashing}
                        onCheckedChange={(checked) => setHomeWashing(checked === true)}
                      />
                      <Label htmlFor="homeWashing" className="text-sm cursor-pointer">
                        Home Washing
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="roofWashing"
                        checked={roofWashing}
                        onCheckedChange={(checked) => setRoofWashing(checked === true)}
                      />
                      <Label htmlFor="roofWashing" className="text-sm cursor-pointer">
                        Roof Washing
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="drivewayWashing"
                        checked={drivewayWashing}
                        onCheckedChange={(checked) => setDrivewayWashing(checked === true)}
                      />
                      <Label htmlFor="drivewayWashing" className="text-sm cursor-pointer">
                        Driveway Cleaning
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="fenceDeckWashing"
                        checked={fenceDeckWashing}
                        onCheckedChange={(checked) => setFenceDeckWashing(checked === true)}
                      />
                      <Label htmlFor="fenceDeckWashing" className="text-sm cursor-pointer">
                        Fence/Deck Cleaning
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 sm:col-span-2">
                      <Checkbox
                        id="otherPressureWashing"
                        checked={otherPressureWashing}
                        onCheckedChange={(checked) => setOtherPressureWashing(checked === true)}
                      />
                      <Label htmlFor="otherPressureWashing" className="text-sm cursor-pointer">
                        Other Pressure Washing
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50">
                    <Checkbox
                      id="gutterCleaning"
                      checked={gutterCleaning}
                      onCheckedChange={(checked) => setGutterCleaning(checked === true)}
                    />
                    <Label htmlFor="gutterCleaning" className="font-medium cursor-pointer">
                      Gutter Cleaning
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50">
                    <Checkbox
                      id="specialtyCleaning"
                      checked={specialtyCleaning}
                      onCheckedChange={(checked) => setSpecialtyCleaning(checked === true)}
                    />
                    <Label htmlFor="specialtyCleaning" className="font-medium cursor-pointer">
                      Specialty Cleaning
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm sm:text-base"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Submit Contact Information"
            )}
          </Button>
        </form>
      )
    }

    switch (formStep) {
      case 1:
        return (
          <form onSubmit={handleStep1Submit} className="space-y-6">
            {/* Add discount banner right here - only show if discount is enabled */}
            {settings?.discount_enabled && (
              <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-base font-semibold text-green-700">
                  🎯 {settings?.discount_message || "Start your quote to see if you qualify for a discount!"}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold">Step 1: Property Information</h2>
              </div>

              <AddressAutocomplete value={address} onChange={setAddress} required />

              <div className="space-y-2">
                <Label htmlFor="stories">Number of Stories *</Label>
                <Select value={stories} onValueChange={setStories} required>
                  <SelectTrigger id="stories">
                    <SelectValue placeholder="Select number of stories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Story</SelectItem>
                    <SelectItem value="2">2 Stories</SelectItem>
                    <SelectItem value="3">3 Stories</SelectItem>
                    <SelectItem value="4">4 or More Stories</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Your Name *</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email Address *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone Number</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>

              {showManualEntry && (
                <div className="space-y-2 mt-4 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <Label htmlFor="manualSquareFootage">Enter Your Home's Square Footage *</Label>
                  <Input
                    id="manualSquareFootage"
                    value={manualSquareFootage}
                    onChange={(e) => setManualSquareFootage(e.target.value)}
                    placeholder="e.g. 2,500"
                    required={showManualEntry}
                  />
                  <p className="text-xs text-amber-700">
                    We couldn't automatically determine your home's size. Please enter the approximate square footage.
                  </p>

                  <Button
                    type="button"
                    onClick={handleManualSquareFootageSubmit}
                    className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Continue with Manual Entry
                  </Button>
                </div>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full text-white text-sm sm:text-base py-3"
              style={{
                backgroundColor: settings?.primary_color || "#3695bb",
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">{loadingMessage}</span>
                  <span className="sm:hidden">Calculating...</span>
                </>
              ) : (
                <>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            {/* Remove the discount banner from here - it was at the bottom */}
          </form>
        )

      case 2:
        return (
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              console.log("🔄 Moving from step 2 to step 3, current quote ID:", currentQuoteId)
              await saveIncompleteQuote(2)
              setFormStep(3)
            }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold">Step 2: Service Selection</h2>
              </div>

              {/* Add discount banner - only show if discount is enabled */}
              {settings?.discount_enabled && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center mb-4">
                  <div className="text-green-800 font-semibold text-lg mb-1">🎉 You Qualified for a Discount!</div>
                  <div className="text-green-700 text-sm">
                    Save {settings?.discount_percentage || 15}% on your window cleaning service
                  </div>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-lg mb-4">
                <div className="flex items-center">
                  <Home className="h-5 w-5 text-slate-600 mr-2" />
                  <div>
                    <p className="font-medium">{address}</p>
                    <p className="text-sm text-slate-600">
                      {stories} {Number.parseInt(stories) === 1 ? "Story" : "Stories"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Service Type *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={serviceType === "Exterior Only Cleaning" ? "default" : "outline"}
                    className={`p-4 h-auto text-left justify-between ${
                      serviceType === "Exterior Only Cleaning"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "border-slate-300 hover:bg-slate-50"
                    }`}
                    onClick={() => setServiceType("Exterior Only Cleaning")}
                  >
                    <div>
                      <div className="font-medium">Exterior Only Cleaning</div>
                      <div className="text-sm opacity-75">Windows cleaned from outside only</div>
                    </div>
                    {propertyData && (
                      <div className="text-right">
                        {settings?.discount_enabled ? (
                          <>
                            <div className="text-sm line-through opacity-75">
                              {formatCurrency(getMarkedUpServiceCost("Exterior Only Cleaning"))}
                            </div>
                            <div className="font-medium">
                              {formatCurrency(getFinalPrice(getServiceCostDisplay("Exterior Only Cleaning")))}
                            </div>
                          </>
                        ) : (
                          <div className="font-medium">
                            {formatCurrency(getServiceCostDisplay("Exterior Only Cleaning"))}
                          </div>
                        )}
                      </div>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant={serviceType === "Interior & Exterior Cleaning" ? "default" : "outline"}
                    className={`p-4 h-auto text-left justify-between ${
                      serviceType === "Interior & Exterior Cleaning"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "border-slate-300 hover:bg-slate-50"
                    }`}
                    onClick={() => setServiceType("Interior & Exterior Cleaning")}
                  >
                    <div>
                      <div className="font-medium">Interior & Exterior Cleaning</div>
                      <div className="text-sm opacity-75">Complete inside and outside cleaning</div>
                    </div>
                    {propertyData && (
                      <div className="text-right">
                        {settings?.discount_enabled ? (
                          <>
                            <div className="text-sm line-through opacity-75">
                              {formatCurrency(getMarkedUpServiceCost("Interior & Exterior Cleaning"))}
                            </div>
                            <div className="font-medium">
                              {formatCurrency(getFinalPrice(getServiceCostDisplay("Interior & Exterior Cleaning")))}
                            </div>
                          </>
                        ) : (
                          <div className="font-medium">
                            {formatCurrency(getServiceCostDisplay("Interior & Exterior Cleaning"))}
                          </div>
                        )}
                      </div>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Label>Add-on Services</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between border rounded-lg p-3 hover:bg-slate-50">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="screenCleaning"
                        checked={screenCleaning}
                        onCheckedChange={(checked) => setScreenCleaning(checked === true)}
                      />
                      <Label htmlFor="screenCleaning" className="font-medium cursor-pointer">
                        Screen Cleaning
                      </Label>
                    </div>
                    {propertyData && (
                      <div className="text-right">
                        {settings?.discount_enabled ? (
                          <>
                            <div className="text-xs text-slate-500 line-through">
                              +{formatCurrency(getMarkedUpAddonCost("Screen Cleaning"))}
                            </div>
                            <div className="font-medium text-green-600">
                              +{formatCurrency(getFinalPrice(getAddonCostDisplay("Screen Cleaning")))}
                            </div>
                          </>
                        ) : (
                          <div className="font-medium">+{formatCurrency(getAddonCostDisplay("Screen Cleaning"))}</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border rounded-lg p-3 hover:bg-slate-50">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="trackCleaning"
                        checked={trackCleaning}
                        onCheckedChange={(checked) => setTrackCleaning(checked === true)}
                      />
                      <Label htmlFor="trackCleaning" className="font-medium cursor-pointer">
                        Track Cleaning
                      </Label>
                    </div>
                    {propertyData && (
                      <div className="text-right">
                        {settings?.discount_enabled ? (
                          <>
                            <div className="text-xs text-slate-500 line-through">
                              +{formatCurrency(getMarkedUpAddonCost("Track Cleaning"))}
                            </div>
                            <div className="font-medium text-green-600">
                              +{formatCurrency(getFinalPrice(getAddonCostDisplay("Track Cleaning")))}
                            </div>
                          </>
                        ) : (
                          <div className="font-medium">+{formatCurrency(getAddonCostDisplay("Track Cleaning"))}</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border rounded-lg p-3 hover:bg-slate-50">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="skylights"
                        checked={skylights}
                        onCheckedChange={(checked) => setSkylights(checked === true)}
                      />
                      <Label htmlFor="skylights" className="font-medium cursor-pointer">
                        Skylights & Hard-to-Reach Glass
                      </Label>
                    </div>
                    <div className="text-right font-medium text-slate-600">Custom Quote</div>
                  </div>
                </div>
              </div>
            </div>

            <Card className="shadow-none border-dashed border-2 border-slate-200">
              <CardHeader className="pb-2">
                <h3 className="text-base font-semibold">Window Specifics (Optional)</h3>
                <p className="text-sm text-muted-foreground">
                  Help us understand your windows better for the most accurate quote.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPostConstruction"
                    checked={isPostConstruction}
                    onCheckedChange={(checked) => setIsPostConstruction(checked === true)}
                  />
                  <Label htmlFor="isPostConstruction" className="font-medium cursor-pointer">
                    Is this a post-construction cleaning (newly built or renovated home)?
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label>Do your windows have decorative grids (muntins)?</Label>
                  <p className="text-sm text-muted-foreground">
                    Grids can be between the glass panes or on the surface of the glass.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={gridType === "none" ? "default" : "outline"}
                      className={`h-auto text-left justify-center ${
                        gridType === "none"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "border-slate-300 hover:bg-slate-50"
                      }`}
                      onClick={() => setGridType("none")}
                    >
                      No Grids
                    </Button>
                    <Button
                      type="button"
                      variant={gridType === "between-panes" ? "default" : "outline"}
                      className={`h-auto text-left justify-center ${
                        gridType === "between-panes"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "border-slate-300 hover:bg-slate-50"
                      }`}
                      onClick={() => setGridType("between-panes")}
                    >
                      Grids Between Panes
                    </Button>
                    <Button
                      type="button"
                      variant={gridType === "on-surface" ? "default" : "outline"}
                      className={`h-auto text-left justify-center ${
                        gridType === "on-surface"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "border-slate-300 hover:bg-slate-50"
                      }`}
                      onClick={() => setGridType("on-surface")}
                    >
                      Grids On Surface
                    </Button>
                  </div>
                </div>

                {Number.parseInt(stories) > 1 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="upperWindowsOpenInside"
                      checked={upperWindowsOpenInside}
                      onCheckedChange={(checked) => setUpperWindowsOpenInside(checked === true)}
                    />
                    <Label htmlFor="upperWindowsOpenInside" className="font-medium cursor-pointer">
                      Do the upper-story windows open inward (can they be cleaned from inside)?
                    </Label>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="panesPerWindow">How many glass panes are typically in one of your windows?</Label>
                  <Select value={panesPerWindow} onValueChange={setPanesPerWindow}>
                    <SelectTrigger id="panesPerWindow">
                      <SelectValue placeholder="Select number of panes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 (Single Pane)</SelectItem>
                      <SelectItem value="2">2 (Double Pane)</SelectItem>
                      <SelectItem value="3+">3 or More Panes</SelectItem>
                      <SelectItem value="unknown">Unsure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="windowManufacturer">
                    Who is the manufacturer of your windows (e.g., Andersen, Pella)?
                  </Label>
                  <Input
                    id="windowManufacturer"
                    value={windowManufacturer}
                    onChange={(e) => setWindowManufacturer(e.target.value)}
                    placeholder="e.g. Andersen, Pella, etc."
                  />
                </div>
              </CardContent>
            </Card>

            {serviceType && (
              <div
                className={
                  settings?.discount_enabled
                    ? "bg-green-50 border border-green-200 rounded-lg p-4"
                    : "bg-slate-50 border border-slate-200 rounded-lg p-4"
                }
              >
                <div className="text-sm text-slate-600">
                  {serviceType === "Interior & Exterior Cleaning" ? "Interior & Exterior" : "Exterior Only"} Window
                  Cleaning
                  {(screenCleaning || trackCleaning) && (
                    <>
                      {" "}
                      with{" "}
                      {[screenCleaning && "Screen Cleaning", trackCleaning && "Track Cleaning"]
                        .filter(Boolean)
                        .join(" & ")}
                    </>
                  )}
                </div>
                {settings?.discount_enabled ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Original Price:</div>
                      <div className="text-lg line-through text-slate-500">
                        {formatCurrency(getOriginalPriceForDisplay(runningTotal))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-green-700">
                        {settings.discount_type === "actual" ? "Discounted Price:" : "Your Price:"}
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-xl font-bold text-green-700">{formatCurrency(runningTotal)}</div>
                        <div className="text-sm text-green-600">
                          {settings.discount_type === "actual"
                            ? `You save ${settings?.discount_percentage || 15}%!`
                            : `You're getting ${settings?.discount_percentage || 15}% off!`}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Current Estimate:</div>
                    <div className="text-xl font-bold">{formatCurrency(runningTotal)}</div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setFormStep(1)} className="border-slate-300">
                Back
              </Button>

              <Button
                type="submit"
                className="text-white"
                style={{ backgroundColor: settings?.primary_color || "#3695bb" }}
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        )

      case 3:
        return (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold">Step 3: Additional Services & Final Quote</h2>
              </div>

              <div className="space-y-3">
                <Label>Additional Services (Optional)</Label>
                <p className="text-sm text-slate-600">
                  Interested in any of these services? We'll provide a separate quote.
                </p>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Pressure Washing Services</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="homeWashing"
                          checked={homeWashing}
                          onCheckedChange={(checked) => setHomeWashing(checked === true)}
                        />
                        <Label htmlFor="homeWashing" className="cursor-pointer">
                          Home Washing
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="roofWashing"
                          checked={roofWashing}
                          onCheckedChange={(checked) => setRoofWashing(checked === true)}
                        />
                        <Label htmlFor="roofWashing" className="cursor-pointer">
                          Roof Washing
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="drivewayWashing"
                          checked={drivewayWashing}
                          onCheckedChange={(checked) => setDrivewayWashing(checked === true)}
                        />
                        <Label htmlFor="drivewayWashing" className="cursor-pointer">
                          Driveway Cleaning
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="fenceDeckWashing"
                          checked={fenceDeckWashing}
                          onCheckedChange={(checked) => setFenceDeckWashing(checked === true)}
                        />
                        <Label htmlFor="fenceDeckWashing" className="cursor-pointer">
                          Fence/Deck Cleaning
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 sm:col-span-2">
                        <Checkbox
                          id="otherPressureWashing"
                          checked={otherPressureWashing}
                          onCheckedChange={(checked) => setOtherPressureWashing(checked === true)}
                        />
                        <Label htmlFor="otherPressureWashing" className="cursor-pointer">
                          Other Pressure Washing Projects
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50">
                      <Checkbox
                        id="gutterCleaning"
                        checked={gutterCleaning}
                        onCheckedChange={(checked) => setGutterCleaning(checked === true)}
                      />
                      <Label htmlFor="gutterCleaning" className="font-medium cursor-pointer">
                        Gutter Cleaning
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50">
                      <Checkbox
                        id="specialtyCleaning"
                        checked={specialtyCleaning}
                        onCheckedChange={(checked) => setSpecialtyCleaning(checked === true)}
                      />
                      <Label htmlFor="specialtyCleaning" className="font-medium cursor-pointer">
                        Specialty Cleaning
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4">
              <div className="text-sm text-slate-600">
                {serviceType === "Interior & Exterior Cleaning" ? "Interior & Exterior" : "Exterior Only"} Window
                Cleaning
                {(screenCleaning || trackCleaning) && (
                  <>
                    {" "}
                    with{" "}
                    {[screenCleaning && "Screen Cleaning", trackCleaning && "Track Cleaning"]
                      .filter(Boolean)
                      .join(" & ")}
                  </>
                )}
              </div>
              {settings?.discount_enabled ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Original Price:</div>
                    <div className="text-lg line-through text-slate-500">
                      {formatCurrency(getOriginalPriceForDisplay(runningTotal))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-green-700">
                      {settings.discount_type === "actual" ? "Discounted Price:" : "Your Price:"}
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-2xl font-bold text-green-700">{formatCurrency(runningTotal)}</div>
                      <div className="text-sm text-green-600">
                        🎉{" "}
                        {settings.discount_type === "actual"
                          ? `You're saving ${formatCurrency(getOriginalPriceForDisplay(runningTotal) - runningTotal)} (${settings?.discount_percentage || 15}% off)!`
                          : `You're getting ${formatCurrency(getOriginalPriceForDisplay(runningTotal) - runningTotal)} off (${settings?.discount_percentage || 15}% discount)!`}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Final Quote:</div>
                  <div className="text-2xl font-bold">{formatCurrency(runningTotal)}</div>
                </div>
              )}

              {skylights && (
                <div className="text-xs text-amber-600 mt-1">
                  * Skylights and hard-to-reach glass will be quoted separately on-site
                </div>
              )}

              {(homeWashing ||
                roofWashing ||
                drivewayWashing ||
                fenceDeckWashing ||
                otherPressureWashing ||
                gutterCleaning ||
                specialtyCleaning) && (
                <div className="text-xs text-blue-600 mt-1">
                  * We'll contact you about your request for additional services
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setFormStep(2)} className="border-slate-300">
                Back
              </Button>

              <Button
                type="submit"
                className="text-white"
                style={{ backgroundColor: settings?.primary_color || "#3695bb" }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Accept Quote & Schedule Service</>
                )}
              </Button>
            </div>
          </form>
        )

      default:
        return null
    }
  }

  try {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-2 sm:p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="w-full shadow-2xl overflow-hidden">
            <CardHeader
              className="text-white text-center py-6 sm:py-8"
              style={{
                background: `linear-gradient(to right, ${settings?.primary_color || "#3695bb"}, ${settings?.secondary_color || "#2a7a9a"})`,
              }}
            >
              <div className="flex items-center justify-center mb-4">
                {settings?.logo_url ? (
                  <img
                    src={settings.logo_url || "/placeholder.svg"}
                    alt={settings.business_name || "Business Logo"}
                    className="h-16 w-auto object-contain"
                  />
                ) : (
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                    {settings?.form_title || "Window Cleaning Calculator"}
                  </h1>
                )}
              </div>
              {settings?.logo_url && (
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                  {settings?.form_title || "Window Cleaning Calculator"}
                </h1>
              )}
              <p className="text-sm sm:text-lg opacity-90">
                {settings?.form_subtitle || "Get an instant quote based on real property data"}
              </p>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 lg:p-8 bg-white">{renderFormStep()}</CardContent>

            {!showSuccess && formStep > 1 && !isOutsideServiceArea && (
              <CardFooter className="bg-slate-50 p-4 border-t flex justify-between items-center">
                <div className="text-sm text-slate-600">Step {formStep} of 3</div>
                {runningTotal > 0 && (
                  <div className="flex items-center">
                    <span className="font-medium">{formatCurrency(runningTotal)}</span>
                  </div>
                )}
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Calculator render error:", error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Loading Calculator...</h1>
          <p className="text-gray-600">Please wait while we set up your quote form.</p>
        </div>
      </div>
    )
  }
}
