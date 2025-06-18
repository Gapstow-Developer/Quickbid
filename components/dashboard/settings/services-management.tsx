"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Edit, Trash2, Plus, Loader2, DollarSign, Calculator } from "lucide-react"
import { ServiceEditDialog } from "./service-edit-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

export function ServicesManagement() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load services
  const loadServices = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/services", {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("Failed to load services")
      }

      const result = await response.json()
      if (result.success) {
        setServices(result.data || [])
      }
    } catch (error) {
      console.error("Failed to load services:", error)
      toast({
        title: "Error",
        description: "Failed to load services.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [])

  const handleToggleActive = async (serviceId: string, isActive: boolean) => {
    try {
      // Optimistically update UI
      setServices(services.map((service) => (service.id === serviceId ? { ...service, is_active: isActive } : service)))

      // Make API call to update service
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: isActive }),
      })

      if (!response.ok) {
        throw new Error("Failed to update service")
      }

      toast({
        title: "Service Updated",
        description: `Service has been ${isActive ? "activated" : "deactivated"}.`,
      })
    } catch (error) {
      // Revert on error
      loadServices()
      toast({
        title: "Error",
        description: "Failed to update service status.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteService = async () => {
    if (!serviceToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/services/${serviceToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete service")
      }

      // Remove from local state
      setServices(services.filter((service) => service.id !== serviceToDelete.id))

      toast({
        title: "Service Deleted",
        description: `${serviceToDelete.name} has been deleted.`,
      })

      setShowDeleteDialog(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete service.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setServiceToDelete(null)
    }
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "main":
        return <Badge className="bg-blue-100 text-blue-800">Main Service</Badge>
      case "addon":
        return (
          <Badge variant="outline" className="border-green-200 text-green-800">
            Add-on
          </Badge>
        )
      case "upsell":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Additional Service
          </Badge>
        )
      default:
        return <Badge variant="outline">{category}</Badge>
    }
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return "—"
    return price.toFixed(price % 1 === 0 ? 0 : 2)
  }

  const getPricingDisplay = (service: Service) => {
    const parts = []

    if (service.per_sqft_price !== null) {
      parts.push(`$${formatPrice(service.per_sqft_price)}/sq ft`)
    }

    if (service.flat_fee !== null) {
      parts.push(`$${formatPrice(service.flat_fee)} flat`)
    }

    if (service.minimum_price !== null) {
      parts.push(`$${formatPrice(service.minimum_price)} min`)
    }

    return parts.length > 0 ? parts.join(" + ") : "Custom Quote"
  }

  const getServiceStats = () => {
    const total = services.length
    const active = services.filter((s) => s.is_active).length
    const mainServices = services.filter((s) => s.category === "main").length
    const addons = services.filter((s) => s.category === "addon").length
    const upsells = services.filter((s) => s.category === "upsell").length

    return { total, active, mainServices, addons, upsells }
  }

  const stats = getServiceStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Service Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Services</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-2xl font-bold">{stats.mainServices}</p>
                <p className="text-xs text-muted-foreground">Main Services</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-2xl font-bold">{stats.addons}</p>
                <p className="text-xs text-muted-foreground">Add-ons</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
              <div>
                <p className="text-2xl font-bold">{stats.upsells}</p>
                <p className="text-xs text-muted-foreground">Additional</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Service Management</CardTitle>
            <CardDescription>Manage your services, pricing, and display options.</CardDescription>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{service.name}</div>
                      {service.description && (
                        <div className="text-sm text-muted-foreground">{service.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryBadge(service.category)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{getPricingDisplay(service)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={service.is_active}
                      onCheckedChange={(checked) => handleToggleActive(service.id, checked)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingService(service)
                          setShowEditDialog(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setServiceToDelete(service)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {services.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No services found. Add your first service to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Service Dialog */}
      <ServiceEditDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          loadServices()
          setShowAddDialog(false)
        }}
      />

      {/* Edit Service Dialog */}
      <ServiceEditDialog
        service={editingService}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={() => {
          loadServices()
          setShowEditDialog(false)
          setEditingService(null)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the service "{serviceToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteService}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
