import { cache } from "react"
import { createClient } from "@/lib/supabase/server"

/**
 * Admin oturum + rol bilgisini tek seferde getirir.
 *
 * React cache() sayesinde AYNI istek icinde (layout + page + alt bilesenler)
 * kac kez cagrilirsa cagrilsin Supabase'e SADECE BIR kez gidilir.
 * Boylece her admin sayfasindaki tekrarli getUser() + admin_users
 * gidis-donusleri (4 ag isteginden 2'ye) yariya iner.
 */
export const getAdminAuth = cache(async () => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, adminUser: null }
  }

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle()

  return { user, adminUser }
})
