"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Clock, CheckCircle, AlertTriangle } from "lucide-react"

export default function FollowUpPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const triggerFollowUpCheck = async () => {
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/check-incomplete-quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.message || "Failed to check incomplete quotes")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const testFollowUpEmail = async () => {
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/test-followup", {
        method: "GET",
      })

      const data = await response.json()

      if (data.success) {
        setResult({
          ...data,
          sent: 1,
          errors: 0,
          processed: 1,
          message: `Test email sent to ${data.customerEmail}`,
        })
      } else {
        setError(data.message || "Failed to send test email")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Follow-Up Email Management</h1>
        <p className="text-muted-foreground">Manage and monitor follow-up emails for incomplete quotes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Follow-Up Email System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">How It Works:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• System automatically checks for incomplete quotes older than 10 minutes</li>
              <li>• Sends "How can we win your business?" email to customers</li>
              <li>• Only sends one follow-up per incomplete quote</li>
              <li>• Skips quotes that were later submitted</li>
            </ul>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={triggerFollowUpCheck} disabled={loading} className="flex items-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  Check Now
                </>
              )}
            </Button>
            <Button
              onClick={testFollowUpEmail}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Test Email
                </>
              )}
            </Button>
            <span className="text-sm text-muted-foreground">Manually trigger follow-up email check</span>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div>
                    <strong>Processed:</strong> {result.processed} incomplete quotes
                  </div>
                  <div>
                    <strong>Emails Sent:</strong> {result.sent}
                  </div>
                  <div>
                    <strong>Errors:</strong> {result.errors}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">{result.message}</div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automation Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-2">Production Setup:</h3>
            <p className="text-sm text-amber-800 mb-3">
              For automatic follow-ups, set up a cron job to call this endpoint every 5-10 minutes:
            </p>
            <code className="bg-amber-100 text-amber-900 px-2 py-1 rounded text-sm">GET /api/cron/followup</code>
            <p className="text-xs text-amber-700 mt-2">
              This can be done through Vercel Cron Jobs, GitHub Actions, or any external cron service.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
