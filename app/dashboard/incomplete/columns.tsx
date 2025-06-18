"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "@/components/ui/use-toast"

export type IncompleteQuote = {
  id: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  address: string | null
  last_step_completed: number
  created_at: string
  updated_at: string
}

const handleDeleteQuote = async (quoteId: string) => {
  if (!confirm("Are you sure you want to delete this incomplete quote? This action cannot be undone.")) {
    return
  }

  try {
    const response = await fetch(`/api/quotes/${quoteId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || "Failed to delete quote")
    }

    toast({
      title: "Success",
      description: "Incomplete quote deleted successfully",
    })

    // Refresh the page
    window.location.reload()
  } catch (error: any) {
    console.error("Error deleting quote:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to delete quote",
      variant: "destructive",
    })
  }
}

const getProgressPercentage = (step: number) => {
  const maxStep = 4
  return Math.min((step / maxStep) * 100, 66) // Cap at 66% for incomplete
}

const getStepDescription = (step: number) => {
  switch (step) {
    case 1:
      return "Basic Info"
    case 2:
      return "Service Selection"
    case 3:
      return "Add-ons & Details"
    case 4:
      return "Contact Info"
    default:
      return "Started"
  }
}

export const columns: ColumnDef<IncompleteQuote>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "customer_name",
    header: "Customer",
    cell: ({ row }) => <div className="font-medium">{row.getValue("customer_name") || "Unknown"}</div>,
  },
  {
    accessorKey: "customer_email",
    header: "Email",
    cell: ({ row }) => <div className="max-w-[200px] truncate">{row.getValue("customer_email") || "N/A"}</div>,
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => <div className="max-w-[200px] truncate">{row.getValue("address") || "N/A"}</div>,
  },
  {
    accessorKey: "last_step_completed",
    header: "Progress",
    cell: ({ row }) => {
      const step = row.getValue("last_step_completed") as number
      const percentage = getProgressPercentage(step)
      const description = getStepDescription(step)

      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Step {step}/4
            </Badge>
            <span className="text-xs text-muted-foreground">{percentage}%</span>
          </div>
          <div className="text-xs text-muted-foreground">{description}</div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "updated_at",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Last Updated
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      try {
        const date = new Date(row.getValue("updated_at"))
        return <div className="text-sm text-muted-foreground">{formatDistanceToNow(date, { addSuffix: true })}</div>
      } catch {
        return <div className="text-sm text-muted-foreground">Invalid date</div>
      }
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const quote = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(quote.id)}>Copy Quote ID</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDeleteQuote(quote.id)} className="text-destructive">
              Delete quote
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
