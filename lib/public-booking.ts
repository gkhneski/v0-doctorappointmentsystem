import type { SupabaseClient } from "@supabase/supabase-js"

// Herkese açık randevu yolunun güvenlik kararları. Yol dosyaları (app/api/appointments/*)
// bu işlevleri çağırır; kararlar burada test edilir.

/** Aynı hafta randevusu ya da kara liste: hangisi olduğu dışarıya söylenmez. */
export const PUBLIC_REFUSAL_MESSAGE =
  "Bu bilgilerle şu anda çevrim içi randevu oluşturulamıyor. Lütfen sekreterimizi arayın: 0531 080 47 20"

export const SMS_FAILED_MESSAGE =
  "Doğrulama SMS'i gönderilemedi. Lütfen telefon numaranızı kontrol edip tekrar deneyin ya da sekreterimizi arayın: 0531 080 47 20"

/** Kodu doğrulanmamış herkese açık randevu bu süreden sonra silinir (kod 10 dakika geçerlidir). */
export const UNVERIFIED_TTL_MINUTES = 15

/**
 * Personelin açtığı randevu bugünkü gibi "scheduled" doğar (hatırlatma alır).
 * Herkese açık randevu, SMS kodu doğrulanana kadar "pending" kalır: takvimde yeri tutar
 * ama hatırlatma görevleri yalnızca scheduled/confirmed seçtiği için SMS almaz.
 */
export function initialStatus(isStaff: boolean): "scheduled" | "pending" {
  return isStaff ? "scheduled" : "pending"
}

/**
 * Doğrulama SMS'inin sonucuna göre ne yapılacağı.
 * Personel: SMS gitmese de devam eder ve kodu ekranda görür (hasta yanındadır).
 * Herkese açık: kod asla yanıta konmaz; SMS gitmediyse randevu geri alınır.
 */
export function smsOutcome(
  isStaff: boolean,
  smsDelivered: boolean,
  code: string,
): { action: "continue"; devCode?: string } | { action: "rollback" } {
  if (smsDelivered) return { action: "continue" }
  return isStaff ? { action: "continue", devCode: code } : { action: "rollback" }
}

/**
 * Süresi geçmiş, doğrulanmamış herkese açık randevuları siler. Hata fırlatmaz.
 * Yalnızca "pending" olmak yetmez: randevunun doğrulanmamış bir SMS kodu olmalı ve hiç
 * doğrulanmış kodu olmamalı. Böylece başka bir yoldan "pending" yazılmış bir randevu silinmez.
 */
export async function purgeStaleUnverified(supabase: SupabaseClient, now: Date = new Date()): Promise<void> {
  try {
    const cutoff = new Date(now.getTime() - UNVERIFIED_TTL_MINUTES * 60_000).toISOString()
    const { data: candidates, error: selectError } = await supabase
      .from("appointments")
      .select("id")
      .eq("status", "pending")
      .lt("created_at", cutoff)
      .limit(200)
    if (selectError) {
      console.error("Unverified appointment purge failed:", selectError.message)
      return
    }
    const ids = (candidates || []).map((a: { id: string }) => a.id)
    if (ids.length === 0) return

    const { data: codes } = await supabase
      .from("sms_verifications")
      .select("appointment_id, verified")
      .in("appointment_id", ids)
    const hasCode = new Set<string>()
    const hasVerified = new Set<string>()
    for (const c of codes || []) {
      hasCode.add(c.appointment_id)
      if (c.verified) hasVerified.add(c.appointment_id)
    }
    const stale = ids.filter((id: string) => hasCode.has(id) && !hasVerified.has(id))
    if (stale.length === 0) return

    const { error } = await supabase.from("appointments").delete().in("id", stale).eq("status", "pending")
    if (error) console.error("Unverified appointment purge failed:", error.message)
  } catch (err: any) {
    console.error("Unverified appointment purge error:", err?.message)
  }
}

/**
 * Kodu artık doğrulanamayacak (süresi dolmuş ya da deneme sınırı aşılmış) herkese açık
 * randevuyu hemen siler ki hasta aynı saati yeniden alabilsin. Personelin açtığı randevu
 * ("scheduled") etkilenmez. Hata fırlatmaz.
 */
export async function releaseIfUnverified(supabase: SupabaseClient, appointmentId: string): Promise<void> {
  try {
    const { error } = await supabase.from("appointments").delete().eq("id", appointmentId).eq("status", "pending")
    if (error) console.error("Unverified appointment release failed:", error.message)
  } catch (err: any) {
    console.error("Unverified appointment release error:", err?.message)
  }
}

const STAFF_WRITABLE_STATUSES = ["scheduled", "confirmed", "cancelled", "completed", "no_show"]

/**
 * Personel bir randevuyu düzenlediğinde yazılacak durum (yoksa undefined = dokunma).
 * - İstenen durum yalnızca bilinen değerlerden biri olabilir; "pending" elle yazılamaz.
 * - Personel doğrulanmamış ("pending") bir randevuyu düzenlerse randevu "scheduled" olur:
 *   artık personelin sorumluluğundadır ve 15 dakika temizliği onu silmemelidir.
 */
export function staffEditStatus(current: string | null | undefined, requested: unknown): string | undefined {
  if (typeof requested === "string" && STAFF_WRITABLE_STATUSES.includes(requested)) return requested
  return current === "pending" ? "scheduled" : undefined
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value)
}
