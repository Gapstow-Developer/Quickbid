import { createServerSupabaseClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export default async function DebugPage() {
  const supabase = createServerSupabaseClient()

  // Test database connection
  let connectionStatus = "Unknown"
  let connectionError = null

  try {
    const { data, error } = await supabase.from("quotes").select("count").limit(1)
    if (error) {
      connectionStatus = "Failed"
      connectionError = error.message
    } else {
      connectionStatus = "Success"
    }
  } catch (err: any) {
    connectionStatus = "Failed"
    connectionError = err.message
  }

  // Get all quotes
  const { data: allQuotes, error: quotesError } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false })

  // Get quotes count by status
  const { data: statusCounts, error: statusError } = await supabase.from("quotes").select("status")

  const statusBreakdown =
    statusCounts?.reduce((acc: any, quote) => {
      acc[quote.status] = (acc[quote.status] || 0) + 1
      return acc
    }, {}) || {}

  // Get settings
  const { data: settings, error: settingsError } = await supabase.from("settings").select("*").single()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Database Debug Information</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Database Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-lg font-semibold ${connectionStatus === "Success" ? "text-green-600" : "text-red-600"}`}
            >
              Status: {connectionStatus}
            </div>
            {connectionError && <div className="text-red-600 text-sm mt-2">Error: {connectionError}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quotes Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>Total Quotes: {allQuotes?.length || 0}</div>
              {Object.entries(statusBreakdown).map(([status, count]) => (
                <div key={status}>
                  {status}: {count as number}
                </div>
              ))}
            </div>
            {quotesError && <div className="text-red-600 text-sm mt-2">Error: {quotesError.message}</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing"}</div>
            <div>
              NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"}
            </div>
            <div>SUPABASE_SERVICE_ROLE_KEY: {process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing"}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settings Data</CardTitle>
        </CardHeader>
        <CardContent>
          {settingsError ? (
            <div className="text-red-600">Error: {settingsError.message}</div>
          ) : settings ? (
            <div className="text-sm">
              <div>Business Name: {settings.business_name}</div>
              <div>Created: {new Date(settings.created_at).toLocaleString()}</div>
            </div>
          ) : (
            <div>No settings found</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Quotes ({allQuotes?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {allQuotes && allQuotes.length > 0 ? (
            <div className="space-y-4">
              {allQuotes.slice(0, 5).map((quote) => (
                <div key={quote.id} className="border p-3 rounded">
                  <div className="font-medium">{quote.customer_name || "Unknown"}</div>
                  <div className="text-sm text-gray-600">
                    {quote.customer_email} | {quote.status} | ${quote.final_price}
                  </div>
                  <div className="text-xs text-gray-500">{new Date(quote.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div>No quotes found in database</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
