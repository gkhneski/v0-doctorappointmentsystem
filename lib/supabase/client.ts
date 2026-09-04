import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Use globalThis to persist client across HMR in development
const globalForSupabase = globalThis as unknown as {
  supabaseClient: ReturnType<typeof createSupabaseClient> | undefined
}

export function createClient() {
  if (globalForSupabase.supabaseClient) {
    return globalForSupabase.supabaseClient
  }

  const client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  )

  if (typeof window !== "undefined") {
    globalForSupabase.supabaseClient = client
  }

  return client
}
