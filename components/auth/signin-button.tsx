"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export function SignInButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    )
  }

  if (session) {
    return (
      <Button variant="outline" onClick={() => signOut()}>
        Sign Out
      </Button>
    )
  }

  return <Button onClick={() => signIn("google")}>Sign In with Google</Button>
}
