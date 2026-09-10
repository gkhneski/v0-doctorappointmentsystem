import { createServiceRoleClient } from "@/lib/supabase/service-role"

/**
 * Postgres tabanli basit sliding-window rate limit.
 * Kotuye kullanimi (SMS/AI spam, otomatik randevu botu) sinirlamak icin kullanilir.
 *
 * Hata olursa "fail-open" davranir (istegi engellemez) — cunku rate limit
 * altyapisi bir aksiliktan dolayi gercek hastalarin randevu almasini engellememeli.
 */
export async function checkRateLimit(bucket: string, max: number, windowSeconds: number): Promise<boolean> {
  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_bucket: bucket,
      p_max: max,
      p_window_seconds: windowSeconds,
    })
    if (error) {
      console.log("[v0] rate limit rpc error:", error.message)
      return true
    }
    return data === true
  } catch (err: any) {
    console.log("[v0] rate limit error:", err?.message)
    return true
  }
}

/** Istekten kaba bir istemci IP'si cikarir (proxy arkasindayken x-forwarded-for). */
export function getClientIp(request: Request): string {
  const h = request.headers
  const fwd = h.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown"
  return h.get("x-real-ip") || "unknown"
}
