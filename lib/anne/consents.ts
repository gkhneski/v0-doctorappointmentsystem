import type { createServiceRoleClient } from "@/lib/supabase/service-role"

// Hastanın onayları. Her değişiklik yeni bir satırdır (kayıt silinmez); geçerli olan,
// o türdeki en son satırdır. Metinler hazır olana kadar sürüm "taslak" ile başlar ve
// uygulamayı yalnızca deneme hesapları kullanır.

type Db = ReturnType<typeof createServiceRoleClient>

export const CONSENT_VERSION = "taslak-1"

export const CONSENT_KINDS = ["aydinlatma", "saglik_verisi", "bildirim"] as const
export type ConsentKind = (typeof CONSENT_KINDS)[number]

/** Bunlar olmadan uygulama sağlık verisi saklamaz ve ana ekranlar açılmaz. */
export const REQUIRED_CONSENTS: readonly ConsentKind[] = ["aydinlatma", "saglik_verisi"]

export type ConsentState = Record<ConsentKind, boolean>

export function isConsentKind(value: unknown): value is ConsentKind {
  return typeof value === "string" && (CONSENT_KINDS as readonly string[]).includes(value)
}

/** Her tür için en son verilen yanıt; hiç yanıt yoksa false. */
export async function latestConsents(db: Db, userId: string): Promise<ConsentState> {
  const state: ConsentState = { aydinlatma: false, saglik_verisi: false, bildirim: false }
  const { data } = await db
    .from("app_consents")
    .select("kind, granted, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  const seen = new Set<string>()
  for (const row of data ?? []) {
    if (seen.has(row.kind) || !isConsentKind(row.kind)) continue
    seen.add(row.kind)
    state[row.kind] = row.granted === true
  }
  return state
}

export function hasRequired(state: ConsentState): boolean {
  return REQUIRED_CONSENTS.every((kind) => state[kind])
}

export async function hasRequiredConsents(db: Db, userId: string): Promise<boolean> {
  return hasRequired(await latestConsents(db, userId))
}

export async function recordConsents(db: Db, userId: string, changes: Partial<ConsentState>): Promise<boolean> {
  const rows = CONSENT_KINDS.filter((kind) => typeof changes[kind] === "boolean").map((kind) => ({
    user_id: userId,
    kind,
    version: CONSENT_VERSION,
    granted: changes[kind] === true,
  }))
  if (rows.length === 0) return true
  const { error } = await db.from("app_consents").insert(rows)
  return !error
}
