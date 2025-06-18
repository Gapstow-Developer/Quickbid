"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Edit, Trash2, Plus } from "lucide-react"
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

interface ServiceSettingsTableProps {
  services: Service[]
}

export function ServiceSettingsTable({ services: initialServices }: ServiceSettingsTableProps) {
  const [services, setServices] = useState<Service[]>(initialServices || [])
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
      setServices(initialServices)
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
        return <Badge>Main</Badge>
      case "addon":
        return <Badge variant="outline">Add-on</Badge>
      case "upsell":
        return <Badge variant="secondary">Upsell</Badge>
      default:
        return <Badge variant="outline">{category}</Badge>
    }
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return "—"
    return price.toFixed(price % 1 === 0 ? 0 : 2)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Service Settings</CardTitle>
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
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Per Sq Ft</TableHead>
              <TableHead className="text-right">Flat Fee</TableHead>
              <TableHead className="text-right">Min Price</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell>{getCategoryBadge(service.category)}</TableCell>
                <TableCell className="text-right">
                  {service.per_sqft_price !== null ? `$${formatPrice(service.per_sqft_price)}` : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {service.flat_fee !== null ? `$${formatPrice(service.flat_fee)}` : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {service.minimum_price !== null ? `$${formatPrice(service.minimum_price)}` : "—"}
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
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  No services found. Add your first service to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <ServiceEditDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          // Refresh the services list
          window.location.reload()
        }}
      />

      <ServiceEditDialog
        service={editingService}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={() => {
          // Refresh the services list
          window.location.reload()
        }}
      />

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
    </Card>
  )
}
