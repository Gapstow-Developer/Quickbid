import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentQuotes } from "@/components/dashboard/recent-quotes"

export const metadata: Metadata = {
  title: "Dashboard - Window Cleaning Calculator",
  description: "Comprehensive dashboard for your window cleaning business",
}

// Force dynamic rendering
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your window cleaning business dashboard.</p>
        </div>

        <DashboardStats />
        <RecentQuotes />
      </div>
    </div>
  )
}
