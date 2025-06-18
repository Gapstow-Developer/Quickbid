import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import SignInClientPage from "./SignInClientPage"

export const metadata: Metadata = {
  title: "Sign In - Window Cleaning Calculator",
  description: "Sign in to access the Window Cleaning Calculator admin dashboard",
}

export default async function SignInPage() {
  const session = await getServerSession(authOptions)

  // If the user is already logged in, redirect to the dashboard
  if (session) {
    redirect("/dashboard")
  }

  return <SignInClientPage />
}
