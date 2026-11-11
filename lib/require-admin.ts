import { NextResponse } from "next/server"
import type { User } from "@supabase/supabase-js"
import { getAdminAuth } from "@/lib/admin-auth"

export type AdminGate =
  | { ok: true; user: User; adminUser: { full_name: string; role: string } }
  | { ok: false; response: NextResponse }

/**
 * Yol işleyicileri için yönetici kontrolü. Ara katman (lib/supabase/proxy.ts) aynı
 * kontrolü yapar; bu, ara katman atlatılsa bile işleyicinin korumasız kalmamasını sağlar.
 *
 * Kullanım:
 *   const gate = await requireAdmin()
 *   if (!gate.ok) return gate.response
 */
export async function requireAdmin(): Promise<AdminGate> {
  try {
    const { user, adminUser } = await getAdminAuth()
    if (!user) {
      return { ok: false, response: NextResponse.json({ error: "Yetkisiz" }, { status: 401 }) }
    }
    if (!adminUser) {
      return { ok: false, response: NextResponse.json({ error: "Bu islem icin yetkiniz yok" }, { status: 403 }) }
    }
    return { ok: true, user, adminUser }
  } catch {
    return { ok: false, response: NextResponse.json({ error: "Yetkisiz" }, { status: 401 }) }
  }
}
