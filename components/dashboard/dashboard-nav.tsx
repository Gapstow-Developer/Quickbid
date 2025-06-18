"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Settings, Users, FileText, AlertCircle, BarChart, Bug, Activity, Mail } from "lucide-react"

// Define navigation items
const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Quotes",
    href: "/dashboard/quotes",
    icon: FileText,
  },
  {
    title: "Incomplete Forms",
    href: "/dashboard/incomplete",
    icon: AlertCircle,
  },
  {
    title: "Follow-Up Emails",
    href: "/dashboard/followup",
    icon: Mail,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  }
]

// Export the DashboardNav component as a named export
export function DashboardNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  // Filter items based on user role
  const filteredItems = navItems.filter((item) => {
    // If this is the User Management item and user is not admin, hide it
    if (item.title === "User Management" && session?.user?.role !== "admin") {
      return false
    }
    return true
  })

  // Add User Management for admins
  if (session?.user?.role === "admin") {
    filteredItems.push({
      title: "User Management",
      href: "/dashboard/users",
      icon: Users,
    })
  }

  return (
    <nav className="grid items-start gap-2 py-4">
      {filteredItems.map((item) => (
        <Button
          key={item.href}
          variant={pathname === item.href ? "secondary" : "ghost"}
          className={cn("justify-start", pathname === item.href && "bg-muted font-medium")}
          asChild
        >
          <Link href={item.href}>
            <item.icon className="mr-2 h-4 w-4" />
            {item.title}
          </Link>
        </Button>
      ))}
    </nav>
  )
}
