import type { SupabaseClient } from "@supabase/supabase-js"

// Herkese açık randevu yolunun güvenlik kararları. Yol dosyaları (app/api/appointments/*)
// bu işlevleri çağırır; kararlar burada test edilir.

/** Aynı hafta randevusu ya da kara liste: hangisi olduğu dışarıya söylenmez. */
export const PUBLIC_REFUSAL_MESSAGE =
  "Bu bilgilerle şu anda çevrim içi randevu oluşturulamıyor. Lütfen sekreterimizi arayın: 0531 080 47 20"

export const SMS_FAILED_MESSAGE =
  "Doğrulama SMS'i gönderilemedi. Lütfen telefon numaranızı kontrol edip tekrar deneyin."

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

/** Süresi geçmiş, doğrulanmamış herkese açık randevuları siler. Hata fırlatmaz. */
export async function purgeStaleUnverified(supabase: SupabaseClient, now: Date = new Date()): Promise<void> {
  try {
    const cutoff = new Date(now.getTime() - UNVERIFIED_TTL_MINUTES * 60_000).toISOString()
    const { error } = await supabase.from("appointments").delete().eq("status", "pending").lt("created_at", cutoff)
    if (error) console.error("Unverified appointment purge failed:", error.message)
  } catch (err: any) {
    console.error("Unverified appointment purge error:", err?.message)
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value)
}
