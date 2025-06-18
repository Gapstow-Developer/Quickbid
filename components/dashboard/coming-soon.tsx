import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Construction, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ComingSoonProps {
  title: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
  expectedDate?: string
}

export function ComingSoon({ title, description, icon: Icon = Construction, expectedDate }: ComingSoonProps) {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="text-base">{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {expectedDate && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium">Expected Launch</p>
                <p className="text-sm text-muted-foreground">{expectedDate}</p>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                We're working hard to bring you this feature. In the meantime, you can:
              </p>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard">View Dashboard</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/quotes">Manage Quotes</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
