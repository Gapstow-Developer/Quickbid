import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { GeneralSettingsForm } from "@/components/dashboard/settings/general-settings-form"
import { ServicesManagement } from "@/components/dashboard/settings/services-management"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function SettingsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your application settings and preferences.</p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <GeneralSettingsForm />
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <ServicesManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
