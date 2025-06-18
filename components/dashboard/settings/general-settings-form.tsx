"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

// Define the form schema
const formSchema = z.object({
  business_name: z.string().min(2, {
    message: "Business name must be at least 2 characters.",
  }),
  business_address: z.string().optional(),
  business_phone: z.string().optional(),
  business_email: z.string().email().optional().or(z.literal("")),
  primary_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Please enter a valid hex color code (e.g. #3695bb)",
  }),
  secondary_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Please enter a valid hex color code (e.g. #2a7a9a)",
  }),
  form_title: z.string().min(2, {
    message: "Form title must be at least 2 characters.",
  }),
  form_subtitle: z.string().optional(),
  notification_emails: z.string().optional(),
  logo_url: z.string().optional(),
  business_email_template: z.string().optional(),
  customer_email_template: z.string().optional(),
})

type SettingsFormValues = z.infer<typeof formSchema>

export function GeneralSettingsForm({ initialSettings }: { initialSettings: any }) {
  const [isLoading, setIsLoading] = useState(false)

  // Parse notification emails from array to string
  const defaultValues: Partial<SettingsFormValues> = {
    business_name: initialSettings?.business_name || "Window Cleaning Business",
    business_address: initialSettings?.business_address || "",
    business_phone: initialSettings?.business_phone || "",
    business_email: initialSettings?.business_email || "",
    primary_color: initialSettings?.primary_color || "#3695bb",
    secondary_color: initialSettings?.secondary_color || "#2a7a9a",
    form_title: initialSettings?.form_title || "Window Cleaning Calculator",
    form_subtitle: initialSettings?.form_subtitle || "Get an instant quote for professional window cleaning services",
    notification_emails: initialSettings?.notification_emails?.join(", ") || "",
    logo_url: initialSettings?.logo_url || "",
    business_email_template:
      initialSettings?.business_email_template ||
      `NEW WINDOW CLEANING QUOTE REQUEST

QUOTE AMOUNT: ${{ finalPrice }}

CUSTOMER INFORMATION:
- Name: {{customerName}}
- Email: {{customerEmail}}
- Phone: {{customerPhone}}
- Address: {{address}}

PROPERTY DETAILS:
- Square Footage: {{squareFootage}} sq ft
- Number of Stories: {{stories}}
- Service Type: {{serviceType}}

SERVICES REQUESTED:
{{services}}

FINAL QUOTE: ${{ finalPrice }}

Generated: {{timestamp}}`,
    customer_email_template:
      initialSettings?.customer_email_template ||
      `Dear {{customerName}},

Thank you for requesting a quote from {{businessName}}.

YOUR QUOTE DETAILS:
- Service: {{serviceType}}
- Property: {{address}}
- Total Quote: ${{ finalPrice }}

Someone from our team will contact you within 24 hours to schedule your service.

Best regards,
{{businessName}}`,
  }

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  async function onSubmit(values: SettingsFormValues) {
    setIsLoading(true)

    try {
      // Convert notification emails from comma-separated string to array
      const notificationEmails = values.notification_emails
        ? values.notification_emails.split(",").map((email) => email.trim())
        : []

      const response = await fetch("/api/settings/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          notification_emails: notificationEmails,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to update settings")
      }

      toast({
        title: "Settings Updated",
        description: "Your settings have been successfully updated.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Configure your business information and calculator appearance.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Information</h3>

              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Business Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="business_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Your business address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="business_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="business_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="info@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Logo</h3>

              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Logo</FormLabel>
                    <div className="space-y-4">
                      {field.value && (
                        <div className="flex items-center space-x-4">
                          <img
                            src={field.value || "/placeholder.svg"}
                            alt="Business logo"
                            className="h-16 w-auto object-contain border rounded"
                          />
                          <Button type="button" variant="outline" onClick={() => field.onChange("")}>
                            Remove Logo
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center space-x-4">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              // Show loading state
                              const formData = new FormData()
                              formData.append("file", file)

                              try {
                                const response = await fetch("/api/upload-logo", {
                                  method: "POST",
                                  body: formData,
                                })

                                const result = await response.json()

                                if (response.ok && result.success) {
                                  field.onChange(result.url)
                                  toast({
                                    title: "Logo Uploaded",
                                    description: "Your logo has been uploaded successfully.",
                                  })
                                } else {
                                  throw new Error(result.message || "Failed to upload logo")
                                }
                              } catch (error: any) {
                                console.error("Failed to upload logo:", error)
                                toast({
                                  title: "Upload Failed",
                                  description: error.message || "Failed to upload logo",
                                  variant: "destructive",
                                })
                              }
                            }
                          }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Upload a logo image. If no logo is provided, your business name will be displayed instead.
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Calculator Appearance</h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="primary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="#3695bb" {...field} />
                        </FormControl>
                        <div className="h-10 w-10 rounded-md border" style={{ backgroundColor: field.value }} />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Color</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="#2a7a9a" {...field} />
                        </FormControl>
                        <div className="h-10 w-10 rounded-md border" style={{ backgroundColor: field.value }} />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="form_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Window Cleaning Calculator" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="form_subtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form Subtitle</FormLabel>
                    <FormControl>
                      <Input placeholder="Get an instant quote for professional window cleaning services" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Notifications</h3>

              <FormField
                control={form.control}
                name="notification_emails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification Emails</FormLabel>
                    <FormControl>
                      <Input placeholder="email1@example.com, email2@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of email addresses that will receive notifications when a quote is submitted.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Email Templates</h3>
              <p className="text-sm text-muted-foreground">
                Customize the email templates sent to your business and customers. Use variables like{" "}
                {`{{customerName}}`}, {`{{finalPrice}}`}, {`{{address}}`}, etc.
              </p>

              <FormField
                control={form.control}
                name="business_email_template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Notification Email Template</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Email template for business notifications..."
                        className="min-h-[200px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This template is used for emails sent to your business when a quote is submitted.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_email_template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Confirmation Email Template</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Email template for customer confirmations..."
                        className="min-h-[200px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This template is used for confirmation emails sent to customers after they submit a quote.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Available Variables:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                  <div>{`{{customerName}}`} - Customer's name</div>
                  <div>{`{{customerEmail}}`} - Customer's email</div>
                  <div>{`{{customerPhone}}`} - Customer's phone</div>
                  <div>{`{{address}}`} - Property address</div>
                  <div>{`{{finalPrice}}`} - Final quote amount</div>
                  <div>{`{{serviceType}}`} - Service type selected</div>
                  <div>{`{{squareFootage}}`} - Property square footage</div>
                  <div>{`{{stories}}`} - Number of stories</div>
                  <div>{`{{businessName}}`} - Your business name</div>
                  <div>{`{{timestamp}}`} - Current date/time</div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
