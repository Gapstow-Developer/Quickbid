import type React from "react"
import { redirect } from "next/navigation"
import { auth, UserButton } from "@clerk/nextjs/server"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { createServerSupabaseClient } from "@/lib/supabase-server"

async function getSettings() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: settings } = await supabase.from("settings").select("*").single()
    return settings
  } catch (error) {
    console.error("Error loading settings:", error)
    return null
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth()
  if (!userId) {
    redirect("/sign-in")
  }

  const settings = await getSettings()

  return (
    <div className="min-h-screen bg-background">
      <div
        className="border-b"
        style={{
          background: `linear-gradient(to right, ${settings?.primary_color || "#3695bb"}, ${settings?.secondary_color || "#2a7a9a"})`,
        }}
      >
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-4">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url || "/placeholder.svg"}
                alt={settings.business_name || "Business Logo"}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <h1 className="text-xl font-semibold text-white">{settings?.business_name || "Dashboard"}</h1>
            )}
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
      <div className="flex">
        <div className="hidden border-r bg-gray-100/40 md:block md:w-[220px] lg:w-[280px]">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex-1 overflow-auto p-2">
              <DashboardNav />
            </div>
          </div>
        </div>
        <div className="flex-1">
          <main className="flex-1 space-y-4 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
