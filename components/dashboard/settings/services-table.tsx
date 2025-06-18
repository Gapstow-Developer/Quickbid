"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, DollarSign, Edit, Save, X, Plus, MapPin, MessageSquare, Settings } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"

type Service = {
  id: string
  name: string
  description: string | null
  category: string
  per_sqft_price: number | null
  flat_fee: number | null
  use_both_pricing: boolean
  minimum_price: number | null
  is_active: boolean
  display_order: number
}

type ServiceSettings = {
  service_radius_miles: number
  outside_area_message: string
}

export function ServicesTable() {
  const [services, setServices] = useState<Service[]>([])
  const [serviceSettings, setServiceSettings] = useState<ServiceSettings>({
    service_radius_miles: 20,
    outside_area_message:
      "We're sorry, but your location is outside our typical service area. Please provide your contact information below and we'll call you to see if we can make an exception for your location.",
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingService, setEditingService] = useState<Partial<Service>>({})
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [tempMessage, setTempMessage] = useState("")
  const [tempRadius, setTempRadius] = useState(20)
  const [savingSettings, setSavingSettings] = useState(false)
  const [newService, setNewService] = useState<Partial<Service>>({
    name: "",
    description: "",
    category: "main",
    per_sqft_price: null,
    flat_fee: null,
    use_both_pricing: false,
    minimum_price: null,
    is_active: true,
  })

  // Load services and settings
  const loadData = async () => {
    try {
      setLoading(true)

      // Load services
      const servicesResponse = await fetch("/api/services", {
        cache: "no-store",
      })

      if (servicesResponse.ok) {
        const servicesResult = await servicesResponse.json()
        if (servicesResult.success) {
          setServices(servicesResult.data || [])
        }
      }

      // Load service settings
      const settingsResponse = await fetch("/api/settings?" + new Date().getTime(), {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (settingsResponse.ok) {
        const settingsResult = await settingsResponse.json()
        if (settingsResult.success && settingsResult.data) {
          setServiceSettings({
            service_radius_miles: settingsResult.data.service_radius_miles || 20,
            outside_area_message:
              settingsResult.data.outside_area_message ||
              "We're sorry, but your location is outside our typical service area. Please provide your contact information below and we'll call you to see if we can make an exception for your location.",
          })
          setTempRadius(settingsResult.data.service_radius_miles || 20)
          setTempMessage(
            settingsResult.data.outside_area_message ||
              "We're sorry, but your location is outside our typical service area. Please provide your contact information below and we'll call you to see if we can make an exception for your location.",
          )
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error)
      setError("Failed to load services and settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Notify calculator of service changes
  const notifyServiceUpdate = () => {
    // Notify other windows/tabs about service updates
    if (typeof window !== "undefined") {
      window.postMessage({ type: "SERVICES_UPDATED" }, "*")
      // Also try to notify parent window if embedded
      if (window.parent !== window) {
        window.parent.postMessage({ type: "SERVICES_UPDATED" }, "*")
      }
    }
  }

  // Save service settings
  const saveServiceSettings = async () => {
    setSavingSettings(true)
    try {
      const response = await fetch("/api/settings/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_radius_miles: tempRadius,
          outside_area_message: tempMessage,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || "Failed to save settings")
      }

      // Update local state
      setServiceSettings({
        service_radius_miles: tempRadius,
        outside_area_message: tempMessage,
      })

      // Notify calculator of changes
      notifyServiceUpdate()

      toast({
        title: "Settings Updated",
        description: "Service area settings have been updated successfully.",
      })

      setShowMessageDialog(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingSettings(false)
    }
  }

  const startEditing = (service: Service) => {
    setEditingId(service.id)
    setEditingService({ ...service })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingService({})
  }

  const saveService = async () => {
    if (!editingId || !editingService) return

    setSaving(true)
    try {
      const response = await fetch(`/api/services/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingService.name,
          description: editingService.description || null,
          category: editingService.category,
          per_sqft_price: editingService.per_sqft_price || null,
          flat_fee: editingService.flat_fee || null,
          use_both_pricing: editingService.use_both_pricing || false,
          minimum_price: editingService.minimum_price || null,
          is_active: editingService.is_active,
          display_order: editingService.display_order || 0,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update service")
      }

      // Update local state
      setServices(services.map((s) => (s.id === editingId ? ({ ...s, ...editingService } as Service) : s)))

      // Notify calculator of changes
      notifyServiceUpdate()

      toast({
        title: "Service Updated",
        description: "Service has been updated successfully.",
      })

      setEditingId(null)
      setEditingService({})
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const addNewService = async () => {
    if (!newService.name) {
      toast({
        title: "Error",
        description: "Service name is required.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newService.name,
          description: newService.description || null,
          category: newService.category,
          per_sqft_price: newService.per_sqft_price || null,
          flat_fee: newService.flat_fee || null,
          use_both_pricing: newService.use_both_pricing || false,
          minimum_price: newService.minimum_price || null,
          is_active: newService.is_active,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create service")
      }

      const result = await response.json()

      // Add to local state
      setServices([...services, result.data])

      // Notify calculator of changes
      notifyServiceUpdate()

      toast({
        title: "Service Added",
        description: "New service has been added successfully.",
      })

      // Reset form
      setNewService({
        name: "",
        description: "",
        category: "main",
        per_sqft_price: null,
        flat_fee: null,
        use_both_pricing: false,
        minimum_price: null,
        is_active: true,
      })
      setShowAddForm(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return

    try {
      const response = await fetch(`/api/services/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete service")
      }

      // Remove from local state
      setServices(services.filter((s) => s.id !== id))

      // Notify calculator of changes
      notifyServiceUpdate()

      toast({
        title: "Service Deleted",
        description: "Service has been deleted successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete service. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "main":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Main Service</Badge>
      case "addon":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Add-on</Badge>
      case "upsell":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Additional Service</Badge>
      default:
        return <Badge variant="outline">{category}</Badge>
    }
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return ""
    return price.toString()
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
    ) : (
      <Badge variant="outline" className="text-gray-500">
        Inactive
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading services...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Service Area Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Service Area Settings
          </CardTitle>
          <CardDescription>Configure your service radius and outside area messaging.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="serviceRadius" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Service Radius (miles)
              </Label>
              <Input
                id="serviceRadius"
                type="number"
                min="1"
                max="100"
                value={tempRadius}
                onChange={(e) => setTempRadius(Number.parseInt(e.target.value) || 20)}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Maximum distance from your business location for standard service
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Outside Area Message
              </Label>
              <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Edit Outside Area Message
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Outside Service Area Message</DialogTitle>
                    <DialogDescription>
                      This message is shown to customers when their location is outside your service radius.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="outsideMessage">Message Text</Label>
                      <Textarea
                        id="outsideMessage"
                        value={tempMessage}
                        onChange={(e) => setTempMessage(e.target.value)}
                        placeholder="Enter the message to show customers outside your service area..."
                        className="min-h-[120px]"
                      />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Preview:</h4>
                      <p className="text-sm text-blue-800">{tempMessage}</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveServiceSettings} disabled={savingSettings}>
                      {savingSettings ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <p className="text-xs text-muted-foreground">
                Current radius: {serviceSettings.service_radius_miles} miles
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <Button onClick={saveServiceSettings} disabled={savingSettings}>
              {savingSettings ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Service Area Settings"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Services Management */}
      <Card>
        <CardHeader>
          <CardTitle>Services Management</CardTitle>
          <CardDescription>Manage your services and pricing structure.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {services.length} service{services.length !== 1 ? "s" : ""} •{" "}
                {services.filter((s) => s.is_active).length} active
              </div>
              <Button onClick={() => setShowAddForm(!showAddForm)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>

            {showAddForm && (
              <div className="border rounded-lg p-4 bg-slate-50">
                <h3 className="font-medium mb-4">Add New Service</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Service Name *</label>
                    <Input
                      value={newService.name || ""}
                      onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                      placeholder="e.g., Window Cleaning"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={newService.category}
                      onValueChange={(value) => setNewService({ ...newService, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">Main Service</SelectItem>
                        <SelectItem value="addon">Add-on</SelectItem>
                        <SelectItem value="upsell">Additional Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Per Sq Ft Price</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formatPrice(newService.per_sqft_price)}
                      onChange={(e) =>
                        setNewService({
                          ...newService,
                          per_sqft_price: e.target.value ? Number.parseFloat(e.target.value) : null,
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Flat Fee</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formatPrice(newService.flat_fee)}
                      onChange={(e) =>
                        setNewService({
                          ...newService,
                          flat_fee: e.target.value ? Number.parseFloat(e.target.value) : null,
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Minimum Price</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formatPrice(newService.minimum_price)}
                      onChange={(e) =>
                        setNewService({
                          ...newService,
                          minimum_price: e.target.value ? Number.parseFloat(e.target.value) : null,
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-full">
                    <label className="text-sm font-medium">Pricing Method *</label>
                    <Select
                      value={
                        newService.use_both_pricing
                          ? "both"
                          : newService.per_sqft_price !== null && newService.flat_fee === null
                            ? "per_sqft"
                            : newService.flat_fee !== null && newService.per_sqft_price === null
                              ? "flat_fee"
                              : "per_sqft"
                      }
                      onValueChange={(value) => {
                        if (value === "per_sqft") {
                          setNewService({
                            ...newService,
                            use_both_pricing: false,
                            // Keep per_sqft_price as is, clear flat_fee
                            flat_fee: null,
                          })
                        } else if (value === "flat_fee") {
                          setNewService({
                            ...newService,
                            use_both_pricing: false,
                            // Keep flat_fee as is, clear per_sqft_price
                            per_sqft_price: null,
                          })
                        } else if (value === "both") {
                          setNewService({
                            ...newService,
                            use_both_pricing: true,
                            // Keep both values as they are
                          })
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pricing method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_sqft">Per Square Foot Only</SelectItem>
                        <SelectItem value="flat_fee">Flat Fee Only</SelectItem>
                        <SelectItem value="both">Both Per Sq Ft + Flat Fee</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Choose how to calculate pricing for this service
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newService.is_active}
                      onCheckedChange={(checked) => setNewService({ ...newService, is_active: checked })}
                    />
                    <label className="text-sm font-medium">Active</label>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newService.description || ""}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addNewService} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Add Service
                  </Button>
                </div>
              </div>
            )}

            {services.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No Services Found</h3>
                <p className="text-sm text-muted-foreground">
                  No services have been configured yet. Add your first service above.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-[200px] font-semibold">Service</TableHead>
                        <TableHead className="w-[120px] font-semibold">Category</TableHead>
                        <TableHead className="w-[160px] font-semibold">Pricing Method</TableHead>
                        <TableHead className="w-[100px] font-semibold text-center">Per Sq Ft</TableHead>
                        <TableHead className="w-[100px] font-semibold text-center">Flat Fee</TableHead>
                        <TableHead className="w-[100px] font-semibold text-center">Minimum</TableHead>
                        <TableHead className="w-[80px] font-semibold text-center">Status</TableHead>
                        <TableHead className="w-[100px] font-semibold text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services
                        .sort((a, b) => a.display_order - b.display_order)
                        .map((service) => (
                          <TableRow key={service.id} className="hover:bg-gray-50/50">
                            <TableCell className="py-4">
                              {editingId === service.id ? (
                                <div className="space-y-2">
                                  <Input
                                    value={editingService.name || ""}
                                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                                    className="font-medium"
                                  />
                                  <Textarea
                                    value={editingService.description || ""}
                                    onChange={(e) =>
                                      setEditingService({ ...editingService, description: e.target.value })
                                    }
                                    placeholder="Description"
                                    rows={2}
                                    className="text-sm"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <div className="font-medium text-gray-900">{service.name}</div>
                                  {service.description && (
                                    <div className="text-sm text-gray-500 mt-1 line-clamp-2">{service.description}</div>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="py-4">
                              {editingId === service.id ? (
                                <Select
                                  value={editingService.category}
                                  onValueChange={(value) => setEditingService({ ...editingService, category: value })}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="main">Main Service</SelectItem>
                                    <SelectItem value="addon">Add-on</SelectItem>
                                    <SelectItem value="upsell">Additional Service</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                getCategoryBadge(service.category)
                              )}
                            </TableCell>
                            <TableCell className="py-4">
                              {editingId === service.id ? (
                                <Select
                                  value={
                                    editingService.use_both_pricing
                                      ? "both"
                                      : editingService.per_sqft_price !== null &&
                                          (editingService.flat_fee === null || editingService.flat_fee === 0)
                                        ? "per_sqft"
                                        : editingService.flat_fee !== null &&
                                            (editingService.per_sqft_price === null ||
                                              editingService.per_sqft_price === 0)
                                          ? "flat_fee"
                                          : "per_sqft"
                                  }
                                  onValueChange={(value) => {
                                    if (value === "per_sqft") {
                                      setEditingService({
                                        ...editingService,
                                        use_both_pricing: false,
                                        flat_fee: null,
                                      })
                                    } else if (value === "flat_fee") {
                                      setEditingService({
                                        ...editingService,
                                        use_both_pricing: false,
                                        per_sqft_price: null,
                                      })
                                    } else if (value === "both") {
                                      setEditingService({
                                        ...editingService,
                                        use_both_pricing: true,
                                      })
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="per_sqft">Per Sq Ft Only</SelectItem>
                                    <SelectItem value="flat_fee">Flat Fee Only</SelectItem>
                                    <SelectItem value="both">Both Methods</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Select
                                  value={
                                    service.use_both_pricing
                                      ? "both"
                                      : service.per_sqft_price !== null && service.per_sqft_price > 0
                                        ? "per_sqft"
                                        : "flat_fee"
                                  }
                                  onValueChange={async (value) => {
                                    const updateData = { ...service }
                                    if (value === "per_sqft") {
                                      updateData.use_both_pricing = false
                                      updateData.flat_fee = null
                                    } else if (value === "flat_fee") {
                                      updateData.use_both_pricing = false
                                      updateData.per_sqft_price = null
                                    } else if (value === "both") {
                                      updateData.use_both_pricing = true
                                    }

                                    try {
                                      const response = await fetch(`/api/services/${service.id}`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(updateData),
                                      })

                                      if (response.ok) {
                                        setServices(services.map((s) => (s.id === service.id ? updateData : s)))
                                        notifyServiceUpdate()
                                        toast({
                                          title: "Pricing Method Updated",
                                          description: "Service pricing method has been updated successfully.",
                                        })
                                      }
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: "Failed to update pricing method.",
                                        variant: "destructive",
                                      })
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="per_sqft">Per Sq Ft Only</SelectItem>
                                    <SelectItem value="flat_fee">Flat Fee Only</SelectItem>
                                    <SelectItem value="both">Both Methods</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
                            <TableCell className="py-4 text-center">
                              {editingId === service.id ? (
                                <div className="flex items-center justify-center">
                                  <DollarSign className="h-3 w-3 text-muted-foreground mr-1" />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={formatPrice(editingService.per_sqft_price)}
                                    onChange={(e) =>
                                      setEditingService({
                                        ...editingService,
                                        per_sqft_price: e.target.value ? Number.parseFloat(e.target.value) : null,
                                      })
                                    }
                                    className="w-20 text-center"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center">
                                  <DollarSign className="h-3 w-3 text-muted-foreground mr-1" />
                                  <span className="text-sm font-medium">
                                    {service.per_sqft_price !== null ? service.per_sqft_price.toFixed(2) : "—"}
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="py-4 text-center">
                              {editingId === service.id ? (
                                <div className="flex items-center justify-center">
                                  <DollarSign className="h-3 w-3 text-muted-foreground mr-1" />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={formatPrice(editingService.flat_fee)}
                                    onChange={(e) =>
                                      setEditingService({
                                        ...editingService,
                                        flat_fee: e.target.value ? Number.parseFloat(e.target.value) : null,
                                      })
                                    }
                                    className="w-20 text-center"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center">
                                  <DollarSign className="h-3 w-3 text-muted-foreground mr-1" />
                                  <span className="text-sm font-medium">
                                    {service.flat_fee !== null ? service.flat_fee.toFixed(0) : "—"}
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="py-4 text-center">
                              {editingId === service.id ? (
                                <div className="flex items-center justify-center">
                                  <DollarSign className="h-3 w-3 text-muted-foreground mr-1" />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={formatPrice(editingService.minimum_price)}
                                    onChange={(e) =>
                                      setEditingService({
                                        ...editingService,
                                        minimum_price: e.target.value ? Number.parseFloat(e.target.value) : null,
                                      })
                                    }
                                    className="w-20 text-center"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center">
                                  <DollarSign className="h-3 w-3 text-muted-foreground mr-1" />
                                  <span className="text-sm font-medium">
                                    {service.minimum_price !== null ? service.minimum_price.toFixed(0) : "—"}
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="py-4 text-center">
                              {editingId === service.id ? (
                                <div className="flex items-center justify-center">
                                  <Switch
                                    checked={editingService.is_active}
                                    onCheckedChange={(checked) =>
                                      setEditingService({ ...editingService, is_active: checked })
                                    }
                                  />
                                </div>
                              ) : (
                                getStatusBadge(service.is_active)
                              )}
                            </TableCell>
                            <TableCell className="py-4 text-center">
                              {editingId === service.id ? (
                                <div className="flex items-center justify-center space-x-1">
                                  <Button size="sm" onClick={saveService} disabled={saving} className="h-8 w-8 p-0">
                                    {saving ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Save className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEditing} className="h-8 w-8 p-0">
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center space-x-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startEditing(service)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => deleteService(service.id)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4">
                  {services
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((service) => (
                      <Card key={service.id} className="p-4">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{service.name}</h3>
                              {service.description && (
                                <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              {getStatusBadge(service.is_active)}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditing(service)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Category and Pricing Method */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Category
                              </label>
                              <div className="mt-1">{getCategoryBadge(service.category)}</div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Pricing Method
                              </label>
                              <div className="mt-1">
                                <Select
                                  value={
                                    service.use_both_pricing
                                      ? "both"
                                      : service.per_sqft_price !== null && service.per_sqft_price > 0
                                        ? "per_sqft"
                                        : "flat_fee"
                                  }
                                  onValueChange={async (value) => {
                                    const updateData = { ...service }
                                    if (value === "per_sqft") {
                                      updateData.use_both_pricing = false
                                      updateData.flat_fee = null
                                    } else if (value === "flat_fee") {
                                      updateData.use_both_pricing = false
                                      updateData.per_sqft_price = null
                                    } else if (value === "both") {
                                      updateData.use_both_pricing = true
                                    }

                                    try {
                                      const response = await fetch(`/api/services/${service.id}`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(updateData),
                                      })

                                      if (response.ok) {
                                        setServices(services.map((s) => (s.id === service.id ? updateData : s)))
                                        notifyServiceUpdate()
                                        toast({
                                          title: "Pricing Method Updated",
                                          description: "Service pricing method has been updated successfully.",
                                        })
                                      }
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: "Failed to update pricing method.",
                                        variant: "destructive",
                                      })
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="per_sqft">Per Sq Ft Only</SelectItem>
                                    <SelectItem value="flat_fee">Flat Fee Only</SelectItem>
                                    <SelectItem value="both">Both Methods</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          {/* Pricing Details */}
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Per Sq Ft
                              </label>
                              <div className="mt-1 flex items-center">
                                <DollarSign className="h-3 w-3 text-muted-foreground mr-1" />
                                <span className="text-sm font-medium">
                                  {service.per_sqft_price !== null ? service.per_sqft_price.toFixed(2) : "—"}
                                </span>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Flat Fee
                              </label>
                              <div className="mt-1 flex items-center">
                                <DollarSign className="h-3 w-3 text-muted-foreground mr-1" />
                                <span className="text-sm font-medium">
                                  {service.flat_fee !== null ? service.flat_fee.toFixed(0) : "—"}
                                </span>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Minimum
                              </label>
                              <div className="mt-1 flex items-center">
                                <DollarSign className="h-3 w-3 text-muted-foreground mr-1" />
                                <span className="text-sm font-medium">
                                  {service.minimum_price !== null ? service.minimum_price.toFixed(0) : "—"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-end pt-2 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteService(service.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </>
            )}

            <div className="text-xs text-muted-foreground">
              Changes to services will automatically update the calculator pricing. Services are used in display order.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
