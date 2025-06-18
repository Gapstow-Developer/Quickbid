import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { createServerSupabaseClient } from "@/lib/supabase"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false

      // Check environment variables first (for initial setup)
      const allowedEmails = process.env.ALLOWED_EMAILS?.split(",") || []
      const allowedDomains = process.env.ALLOWED_DOMAINS?.split(",") || []

      if (allowedEmails.includes(user.email)) return true

      const emailDomain = user.email.split("@")[1]
      if (allowedDomains.includes(emailDomain)) return true

      // Then check database for dynamic management
      try {
        const supabase = createServerSupabaseClient()

        // Check if the user's email is directly authorized
        const { data: directAuth } = await supabase
          .from("authorized_users")
          .select("*")
          .eq("email", user.email)
          .eq("is_active", true)
          .single()

        if (directAuth) return true

        // Check if the user's domain is authorized
        const { data: domainAuth } = await supabase
          .from("authorized_users")
          .select("*")
          .eq("domain", emailDomain)
          .eq("is_active", true)
          .single()

        if (domainAuth) return true
      } catch (error) {
        console.error("Error checking authorized users:", error)
      }

      // If we get here, the user is not allowed
      return false
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = "user" // Default role

        try {
          const supabase = createServerSupabaseClient()
          const { data } = await supabase.from("authorized_users").select("role").eq("email", user.email).single()

          if (data) {
            token.role = data.role
          }
        } catch (error) {
          console.error("Error fetching user role:", error)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
