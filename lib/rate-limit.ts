import { createServiceRoleClient } from "@/lib/supabase/service-role"

/**
 * Postgres tabanli basit sliding-window rate limit (SQL'i: scripts/rate-limit.sql).
 * Kotuye kullanimi (SMS/AI spam, otomatik randevu botu) sinirlamak icin kullanilir.
 *
 * Altyapi hatasinda varsayilan davranis "fail-open"dur (istegi engellemez) — rate limit
 * bir aksilikten dolayi gercek hastalarin randevu almasini engellememeli.
 * Kod denemesi ve yapay zeka gibi kotuye kullanimi pahali yollar `failClosed: true` verir:
 * sinir kontrol edilemiyorsa istek reddedilir.
 */
export async function checkRateLimit(
  bucket: string,
  max: number,
  windowSeconds: number,
  options: { failClosed?: boolean } = {},
): Promise<boolean> {
  const result = await checkRateLimitDetailed(bucket, max, windowSeconds)
  if (result === "error") return !options.failClosed
  return result === "allowed"
}

/**
 * Sinir asimi ("limited") ile altyapi hatasini ("error") ayirir. Ikisine farkli davranmasi
 * gereken yollar icin (or. kod dogrulama: hata durumunda kod iptal edilmemeli).
 */
export async function checkRateLimitDetailed(
  bucket: string,
  max: number,
  windowSeconds: number,
): Promise<"allowed" | "limited" | "error"> {
  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_bucket: bucket,
      p_max: max,
      p_window_seconds: windowSeconds,
    })
    if (error) {
      console.error("rate limit rpc error:", error.message)
      return "error"
    }
    return data === true ? "allowed" : "limited"
  } catch (err: any) {
    console.error("rate limit error:", err?.message)
    return "error"
  }
}

/** Istekten kaba bir istemci IP'si cikarir (proxy arkasindayken x-forwarded-for). */
export function getClientIp(request: Request): string {
  const h = request.headers
  const fwd = h.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown"
  return h.get("x-real-ip") || "unknown"
}
