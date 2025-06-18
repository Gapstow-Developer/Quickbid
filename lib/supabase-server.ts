import { createClient as _createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export const createServerSupabaseClient = () => {
  const cookieStore = cookies()
  return _createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for server-side operations
    {
      auth: {
        persistSession: false,
      },
    },
  )
}

// Export createClient as a named export for compatibility
export const createClient = createServerSupabaseClient
