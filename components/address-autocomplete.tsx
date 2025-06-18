"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
}

export function AddressAutocomplete({ value, onChange, required = false }: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)

  // Load Google Maps API script
  useEffect(() => {
    if (window.google?.maps?.places) {
      setIsScriptLoaded(true)
      return
    }

    setIsLoading(true)
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAPgad6Y-v0_gOf6IbTplAIniz34cUSHc0&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      setIsScriptLoaded(true)
      setIsLoading(false)
    }
    script.onerror = () => {
      console.error("Error loading Google Maps API")
      setIsLoading(false)
    }
    document.head.appendChild(script)

    return () => {
      // Clean up script if component unmounts before script loads
      if (!isScriptLoaded) {
        document.head.removeChild(script)
      }
    }
  }, [])

  // Initialize autocomplete when script is loaded and input is available
  useEffect(() => {
    if (isScriptLoaded && inputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "us" },
        fields: ["address_components", "formatted_address", "geometry", "name"],
        types: ["address"],
      })

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace()
        if (place.formatted_address) {
          onChange(place.formatted_address)
        }
      })
    }
  }, [isScriptLoaded, onChange])

  return (
    <div className="space-y-2">
      <Label htmlFor="address">Property Address *</Label>
      <div className="relative">
        <Input
          id="address"
          ref={inputRef}
          placeholder="Start typing your address..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="pr-10"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Start typing and select your address from the dropdown for accurate quotes
      </p>
    </div>
  )
}
