"use client"

import { QuotesTable } from "@/components/dashboard/quotes-table"
import { createServerSupabaseClient } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { unstable_noStore } from "next/cache"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Suspense, useState, useEffect } from "react"

// Force dynamic rendering
export const dynamic = "force-dynamic"

// Add these lines after the existing exports
export const revalidate = 0
export const fetchCache = "force-no-store"

interface QuotesPageProps {
  searchParams: {
    status?: string
  }
}

function QuotesContent({ searchParams }: QuotesPageProps) {
  unstable_noStore() // Added call to prevent caching

  const statusFilter = searchParams.status || "all" // Default to 'all'
  const [quotes, setQuotes] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createServerSupabaseClient()

        let query = supabase.from("quotes").select("*")

        if (statusFilter && statusFilter !== "all") {
          query = query.eq("status", statusFilter)
        }

        const { data, error: fetchError } = await query.order("created_at", { ascending: false })

        if (fetchError) {
          console.error("Error fetching quotes:", fetchError)
          setError(fetchError.message)
        } else {
          setQuotes(data || [])
        }
      } catch (err: any) {
        console.error("Error in quotes page:", err)
        setError(err.message || "Unknown error occurred")
      }
    }

    fetchData()
  }, [statusFilter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Quotes</h2>
        <div className="flex items-center gap-2">
          <Select
            onValueChange={(value) => {
              const newUrl = new URL(window.location.href)
              newUrl.searchParams.set("status", value)
              window.location.href = newUrl.toString()
            }}
            value={statusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quotes</SelectItem>
              <SelectItem value="submitted">Submitted Quotes</SelectItem>
              <SelectItem value="incomplete">Incomplete Quotes</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground">{error ? "Error loading" : `Total: ${quotes.length}`}</div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading quotes: {error}
            <br />
            <span className="text-sm">Check your database connection and ensure the quotes table exists.</span>
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
        <QuotesTable quotes={quotes} />
      </div>
    </div>
  )
}

export default function QuotesPage(props: QuotesPageProps) {
  return (
    <Suspense fallback={<div>Loading quotes...</div>}>
      <QuotesContent {...props} />
    </Suspense>
  )
}
