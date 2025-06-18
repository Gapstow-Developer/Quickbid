"use client"

import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import type { Database } from "@/types/supabase"

type Quote = Database["public"]["Tables"]["quotes"]["Row"]

interface RecentQuotesProps {
  quotes: Quote[]
}

export function RecentQuotes({ quotes }: RecentQuotesProps) {
  return (
    <div className="space-y-4">
      {quotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent quotes found.</p>
      ) : (
        quotes.map((quote) => (
          <div key={quote.id} className="flex items-center justify-between space-x-4 rounded-md border p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{quote.customer_name || "Unknown Customer"}</p>
              <p className="text-sm text-muted-foreground">{quote.address || "No address provided"}</p>
              <div className="flex items-center pt-2">
                <Badge variant={quote.status === "submitted" ? "default" : "outline"}>
                  {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                </Badge>
                <p className="text-xs text-muted-foreground ml-2">
                  {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{quote.final_price ? `$${quote.final_price}` : "N/A"}</p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
