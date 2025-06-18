"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/types/supabase"

type Quote = Database["public"]["Tables"]["quotes"]["Row"]

interface QuoteDetailsDialogProps {
  quoteId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuoteDetailsDialog({ quoteId, open, onOpenChange }: QuoteDetailsDialogProps) {
  const [quoteDetails, setQuoteDetails] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchQuoteDetails() {
      if (!quoteId) {
        setQuoteDetails(null)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/quotes/${quoteId}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || "Failed to fetch quote details")
        }

        setQuoteDetails(result.data)
      } catch (error: any) {
        console.error("Error fetching quote details:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load quote details.",
          variant: "destructive",
        })
        setQuoteDetails(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuoteDetails()
  }, [quoteId, toast])

  const formatValue = (key: string, value: any) => {
    if (typeof value === "boolean") {
      return value ? "Yes" : "No"
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : "N/A"
    }
    if (typeof value === "object" && value !== null) {
      return (
        <div className="ml-4 mt-2 space-y-1">
          {Object.entries(value).map(([subKey, subValue]) => (
            <div key={subKey} className="flex justify-between">
              <span className="font-medium capitalize">{subKey.replace(/_/g, " ")}:</span>
              <span>{formatValue(subKey, subValue)}</span>
            </div>
          ))}
        </div>
      )
    }
    return value || "N/A"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Quote Details</DialogTitle>
          <DialogDescription>Comprehensive information about the customer's quote.</DialogDescription>
        </DialogHeader>
        {isLoading && <div className="text-center py-8">Loading details...</div>}
        {!isLoading && !quoteDetails && (
          <div className="text-center py-8 text-red-500">Failed to load quote details.</div>
        )}
        {!isLoading && quoteDetails && (
          <ScrollArea className="flex-grow pr-4">
            <div className="grid gap-4 py-4">
              <h3 className="text-lg font-semibold">Customer Information</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Name:</div>
                <div>{quoteDetails.customer_name || "N/A"}</div>
                <div className="font-medium">Email:</div>
                <div>{quoteDetails.customer_email || "N/A"}</div>
                <div className="font-medium">Phone:</div>
                <div>{quoteDetails.customer_phone || "N/A"}</div>
                <div className="font-medium">Address:</div>
                <div>{quoteDetails.address || "N/A"}</div>
              </div>

              <Separator className="my-4" />

              <h3 className="text-lg font-semibold">Quote Summary</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Square Footage:</div>
                <div>{quoteDetails.square_footage || "N/A"} sqft</div>
                <div className="font-medium">Stories:</div>
                <div>{quoteDetails.stories || "N/A"}</div>
                <div className="font-medium">Service Type:</div>
                <div>{quoteDetails.service_type || "N/A"}</div>
                <div className="font-medium">Add-ons:</div>
                <div>{quoteDetails.addons?.join(", ") || "None"}</div>
                <div className="font-medium">Final Price:</div>
                <div>
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                    quoteDetails.final_price || 0,
                  )}
                </div>
                <div className="font-medium">Status:</div>
                <div>{quoteDetails.status || "N/A"}</div>
                <div className="font-medium">Notes:</div>
                <div>{quoteDetails.notes || "N/A"}</div>
                <div className="font-medium">Distance:</div>
                <div>{quoteDetails.distance ? `${quoteDetails.distance.toFixed(2)} miles` : "N/A"}</div>
              </div>

              <Separator className="my-4" />

              <h3 className="text-lg font-semibold">Detailed Calculator Data</h3>
              {quoteDetails.quote_data && Object.keys(quoteDetails.quote_data).length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(quoteDetails.quote_data).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="font-bold capitalize">{key.replace(/_/g, " ")}:</span>
                      <div className="ml-2">{formatValue(key, value)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>No detailed calculator data available.</div>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
