import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// Singleton pattern: Only ONE browser client instance across the entire app
// This prevents "Multiple GoTrueClient instances" errors
let browserClient: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (browserClient) {
    return browserClient
  }

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return browserClient
}
