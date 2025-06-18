"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDistanceToNow } from "date-fns"
import { Mail, Clock, Send, CheckCircle, AlertCircle, User, MapPin, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/types/supabase"

type Quote = Database["public"]["Tables"]["quotes"]["Row"]

interface FollowUpCenterProps {
  followUpNeeded: Quote[]
  allIncomplete: Quote[]
}

export function FollowUpCenter({ followUpNeeded, allIncomplete }: FollowUpCenterProps) {
  const [sendingFollowUp, setSendingFollowUp] = useState<string | null>(null)
  const [sentFollowUps, setSentFollowUps] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const handleSendFollowUp = async (quote: Quote) => {
    setSendingFollowUp(quote.id)

    try {
      const response = await fetch("/api/send-followup-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteData: {
            customerName: quote.customer_name,
            customerEmail: quote.customer_email,
            customerPhone: quote.customer_phone,
            address: quote.address,
            serviceType: quote.service_type,
            stories: quote.stories,
            squareFootage: quote.square_footage,
            addons: quote.addons || [],
            hasSkylights: quote.has_skylights,
            additionalServices: quote.additional_services || {},
            finalPrice: quote.final_price,
            lastStepCompleted: quote.last_step_completed,
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSentFollowUps((prev) => new Set([...prev, quote.id]))
        toast({
          title: "Follow-up sent!",
          description: `Follow-up email sent to ${quote.customer_name}`,
        })
      } else {
        throw new Error(result.error || "Failed to send follow-up")
      }
    } catch (error: any) {
      toast({
        title: "Error sending follow-up",
        description: error.message || "Failed to send follow-up email",
        variant: "destructive",
      })
    } finally {
      setSendingFollowUp(null)
    }
  }

  const handleBulkFollowUp = async () => {
    setSendingFollowUp("bulk")
    let successCount = 0
    let errorCount = 0

    for (const quote of followUpNeeded) {
      if (sentFollowUps.has(quote.id)) continue

      try {
        await handleSendFollowUp(quote)
        successCount++
        // Add delay between emails
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        errorCount++
      }
    }

    toast({
      title: "Bulk follow-up complete",
      description: `Sent ${successCount} emails${errorCount > 0 ? `, ${errorCount} failed` : ""}`,
    })

    setSendingFollowUp(null)
  }

  const followUpsSent = allIncomplete.filter((q) => q.followup_sent_at).length
  const totalIncomplete = allIncomplete.length

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready for Follow-up</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{followUpNeeded.length}</div>
            <p className="text-xs text-muted-foreground">Quotes older than 10 minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incomplete</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIncomplete}</div>
            <p className="text-xs text-muted-foreground">All incomplete quotes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-ups Sent</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{followUpsSent}</div>
            <p className="text-xs text-muted-foreground">
              {totalIncomplete > 0 ? Math.round((followUpsSent / totalIncomplete) * 100) : 0}% of incomplete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${followUpNeeded.reduce((sum, q) => sum + (q.final_price || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">From follow-up ready quotes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ready" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ready">Ready for Follow-up ({followUpNeeded.length})</TabsTrigger>
          <TabsTrigger value="sent">Follow-ups Sent ({followUpsSent})</TabsTrigger>
          <TabsTrigger value="all">All Incomplete ({totalIncomplete})</TabsTrigger>
        </TabsList>

        {/* Ready for Follow-up */}
        <TabsContent value="ready" className="space-y-4">
          {followUpNeeded.length > 0 && (
            <div className="flex justify-between items-center">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{followUpNeeded.length} quotes are ready for follow-up emails</AlertDescription>
              </Alert>
              <Button onClick={handleBulkFollowUp} disabled={sendingFollowUp === "bulk"} className="ml-4">
                <Send className="mr-2 h-4 w-4" />
                {sendingFollowUp === "bulk" ? "Sending..." : `Send All (${followUpNeeded.length})`}
              </Button>
            </div>
          )}

          <div className="grid gap-4">
            {followUpNeeded.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-lg font-medium">All caught up!</h3>
                    <p className="text-muted-foreground">No quotes need follow-up at this time.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              followUpNeeded.map((quote) => (
                <Card key={quote.id} className="border-orange-200">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          {quote.customer_name || "Unknown Customer"}
                        </CardTitle>
                        <CardDescription className="flex items-center">
                          <Mail className="mr-1 h-3 w-3" />
                          {quote.customer_email}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <MapPin className="mr-2 h-3 w-3" />
                          {quote.address || "No address provided"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Service:{" "}
                          {quote.service_type?.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Unknown"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Size: {quote.square_footage ? `${quote.square_footage.toLocaleString()} sq ft` : "Unknown"}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">Last Step: {quote.last_step_completed || "Unknown"}</div>
                        {quote.final_price && (
                          <div className="text-lg font-semibold text-green-600">
                            ${quote.final_price.toLocaleString()}
                          </div>
                        )}
                        <Button
                          onClick={() => handleSendFollowUp(quote)}
                          disabled={sendingFollowUp === quote.id || sentFollowUps.has(quote.id)}
                          className="w-full"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {sendingFollowUp === quote.id
                            ? "Sending..."
                            : sentFollowUps.has(quote.id)
                              ? "Sent!"
                              : "Send Follow-up"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Follow-ups Sent */}
        <TabsContent value="sent" className="space-y-4">
          <div className="grid gap-4">
            {allIncomplete
              .filter((q) => q.followup_sent_at)
              .map((quote) => (
                <Card key={quote.id} className="border-green-200">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center">
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          {quote.customer_name || "Unknown Customer"}
                        </CardTitle>
                        <CardDescription>{quote.customer_email}</CardDescription>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Follow-up sent {formatDistanceToNow(new Date(quote.followup_sent_at!), { addSuffix: true })}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Quote created {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
                      {quote.final_price && ` • $${quote.final_price.toLocaleString()}`}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* All Incomplete */}
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {allIncomplete.map((quote) => (
              <Card key={quote.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{quote.customer_name || "Unknown Customer"}</CardTitle>
                      <CardDescription>{quote.customer_email}</CardDescription>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={quote.followup_sent_at ? "default" : "secondary"}>
                        {quote.followup_sent_at ? "Follow-up sent" : "No follow-up"}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="text-sm">Step {quote.last_step_completed || "Unknown"} completed</div>
                    {quote.final_price && (
                      <div className="text-sm font-medium">${quote.final_price.toLocaleString()}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
