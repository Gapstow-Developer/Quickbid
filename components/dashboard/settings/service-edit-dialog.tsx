"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Service name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  category: z.enum(["main", "addon", "upsell"]),
  per_sqft_price: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseFloat(val) : null)),
  flat_fee: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseFloat(val) : null)),
  use_both_pricing: z.boolean().default(false),
  minimum_price: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseFloat(val) : null)),
  is_active: z.boolean().default(true),
  display_order: z.number().default(0),
})

type FormValues = z.infer<typeof formSchema>

interface ServiceEditDialogProps {
  service?: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ServiceEditDialog({ service, open, onOpenChange, onSuccess }: ServiceEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!service

  const defaultValues: Partial<FormValues> = {
    name: service?.name || "",
    description: service?.description || "",
    category: service?.category || "main",
    per_sqft_price: service?.per_sqft_price !== null ? String(service.per_sqft_price) : "",
    flat_fee: service?.flat_fee !== null ? String(service.flat_fee) : "",
    use_both_pricing: service?.use_both_pricing || false,
    minimum_price: service?.minimum_price !== null ? String(service.minimum_price) : "",
    is_active: service?.is_active !== undefined ? service.is_active : true,
    display_order: service?.display_order || 0,
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  // Reset form when dialog opens/closes or service changes
  useState(() => {
    if (open) {
      form.reset(defaultValues)
    }
  })

  async function onSubmit(values: FormValues) {
    setIsLoading(true)

    try {
      const endpoint = isEditing ? `/api/services/${service.id}` : "/api/services"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save service")
      }

      toast({
        title: isEditing ? "Service Updated" : "Service Created",
        description: isEditing
          ? "Your service has been updated successfully."
          : "Your new service has been created successfully.",
      })

      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save service",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Service" : "Add New Service"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the details for this service." : "Add a new service to your calculator."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Window Cleaning" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description of the service" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>Optional description to help explain the service to customers.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="main">Main Service</SelectItem>
                      <SelectItem value="addon">Add-on</SelectItem>
                      <SelectItem value="upsell">Upsell</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Main services are primary offerings, add-ons are optional extras, and upsells are premium upgrades.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="per_sqft_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Per Square Foot Price</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                          $
                        </span>
                        <Input type="number" step="0.01" min="0" placeholder="0.00" className="pl-6" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription>Leave blank if not applicable.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="flat_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flat Fee</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                          $
                        </span>
                        <Input type="number" step="0.01" min="0" placeholder="0.00" className="pl-6" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription>Leave blank if not applicable.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="use_both_pricing"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Use Both Pricing Methods</FormLabel>
                    <FormDescription>
                      If enabled, both per square foot and flat fee will be added together.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minimum_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Price</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" className="pl-6" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>
                    The minimum amount to charge for this service, regardless of calculation.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>If disabled, this service won't appear in the calculator.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : isEditing ? (
                  "Update Service"
                ) : (
                  "Create Service"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
