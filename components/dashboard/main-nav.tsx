"use client"

import type React from "react"

import Link from "next/link"
import { cn } from "@/lib/utils"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
      <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
        Overview
      </Link>
      <Link
        href="/dashboard/quotes"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Quotes
      </Link>
      <Link
        href="/dashboard/incomplete"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Incomplete Forms
      </Link>
      <Link
        href="/dashboard/followup"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Follow-ups
      </Link>
      <Link
        href="/dashboard/settings"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Settings
      </Link>
      <Link
        href="/dashboard/users"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Users
      </Link>
    </nav>
  )
}
