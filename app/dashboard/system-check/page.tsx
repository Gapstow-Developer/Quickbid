import { createServerSupabaseClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function SystemCheckPage() {
  const supabase = createServerSupabaseClient()

  // Test 1: Database Connection
  let dbConnection = { status: "Unknown", error: null }
  try {
    const { data, error } = await supabase.from("quotes").select("count").limit(1)
    dbConnection = error ? { status: "Failed", error: error.message } : { status: "Success", error: null }
  } catch (err: any) {
    dbConnection = { status: "Failed", error: err.message }
  }

  // Test 2: Settings Table
  let settingsTest = { status: "Unknown", error: null, data: null }
  try {
    const { data, error } = await supabase.from("settings").select("*").single()
    if (error && error.code !== "PGRST116") {
      settingsTest = { status: "Failed", error: error.message, data: null }
    } else {
      settingsTest = { status: "Success", error: null, data }
    }
  } catch (err: any) {
    settingsTest = { status: "Failed", error: err.message, data: null }
  }

  // Test 3: Quotes Table
  let quotesTest = { status: "Unknown", error: null, count: 0 }
  try {
    const { data, error } = await supabase.from("quotes").select("*")
    if (error) {
      quotesTest = { status: "Failed", error: error.message, count: 0 }
    } else {
      quotesTest = { status: "Success", error: null, count: data?.length || 0 }
    }
  } catch (err: any) {
    quotesTest = { status: "Failed", error: err.message, count: 0 }
  }

  // Test 4: Services Table
  let servicesTest = { status: "Unknown", error: null, count: 0 }
  try {
    const { data, error } = await supabase.from("services").select("*")
    if (error) {
      servicesTest = { status: "Failed", error: error.message, count: 0 }
    } else {
      servicesTest = { status: "Success", error: null, count: data?.length || 0 }
    }
  } catch (err: any) {
    servicesTest = { status: "Failed", error: err.message, count: 0 }
  }

  // Test 5: Environment Variables
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
  }

  const StatusBadge = ({ status }: { status: string }) => (
    <Badge variant={status === "Success" ? "default" : status === "Failed" ? "destructive" : "secondary"}>
      {status}
    </Badge>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">System Health Check</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Database Connection
              <StatusBadge status={dbConnection.status} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dbConnection.error && <div className="text-red-600 text-sm">{dbConnection.error}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Settings Table
              <StatusBadge status={settingsTest.status} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {settingsTest.error ? (
              <div className="text-red-600 text-sm">{settingsTest.error}</div>
            ) : settingsTest.data ? (
              <div className="text-sm">
                <div>Business: {settingsTest.data.business_name}</div>
                <div>Form Title: {settingsTest.data.form_title}</div>
              </div>
            ) : (
              <div className="text-gray-600 text-sm">No settings found (will use defaults)</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Quotes Table
              <StatusBadge status={quotesTest.status} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quotesTest.error ? (
              <div className="text-red-600 text-sm">{quotesTest.error}</div>
            ) : (
              <div className="text-sm">Total Quotes: {quotesTest.count}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Services Table
              <StatusBadge status={servicesTest.status} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {servicesTest.error ? (
              <div className="text-red-600 text-sm">{servicesTest.error}</div>
            ) : (
              <div className="text-sm">Total Services: {servicesTest.count}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-sm">{key}:</span>
                <StatusBadge status={value ? "Success" : "Failed"} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/api/settings" target="_blank" className="text-blue-600 hover:underline" rel="noreferrer">
              Test Settings API →
            </a>
            <a href="/api/quotes" target="_blank" className="text-blue-600 hover:underline" rel="noreferrer">
              Test Quotes API →
            </a>
            <a href="/api/services" target="_blank" className="text-blue-600 hover:underline" rel="noreferrer">
              Test Services API →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
