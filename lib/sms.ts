import { toNetgsmNumber } from "@/lib/phone"

// SMS saglayicisina (NETGSM) giden TEK yer. Baska hicbir dosya saglayiciya dogrudan
// istek atmaz (tests/guards/single-sms-sender.test.ts bunu denetler).
//
// Sifre adres satirinda degil, yetki basliginda gider: adres satirlari sunucu ve
// ara katman kayitlarina yazilir, basliklar yazilmaz.

const SEND_URL = "https://api.netgsm.com.tr/sms/rest/v2/send"
const DEFAULT_HEADER = "SAGLIK"
const DEFAULT_TIMEOUT_MS = 15_000

export type SmsResult = {
  /** Saglayici mesaji kabul etti mi? */
  sent: boolean
  /**
   * Saglayici kodu ("00" kabul, "30" giris bilgisi hatasi, ...) ya da saglayiciya
   * gidilemediyse: "credentials_missing" | "invalid_phone" | "network_error" | "invalid_response".
   */
  code: string
  /** Kayit icin kisa metin: "00 <is numarasi>" ya da hata kodu. Giris bilgisi icermez. */
  reference: string
}

export type SendSmsOptions = {
  /** TR cep telefonu olmayan numaralari gondermeden reddet. Varsayilan: rakamlariyla gonderilir. */
  strictPhone?: boolean
  timeoutMs?: number
}

function failed(code: string): SmsResult {
  return { sent: false, code, reference: code }
}

export async function sendSms(
  phone: string | null | undefined,
  message: string,
  options: SendSmsOptions = {},
): Promise<SmsResult> {
  const user = process.env.NETGSM_USER
  const password = process.env.NETGSM_PASSWORD
  if (!user || !password) return failed("credentials_missing")

  const number = toNetgsmNumber(phone) ?? (options.strictPhone ? "" : String(phone ?? "").replace(/\D/g, ""))
  if (!number) return failed("invalid_phone")

  let raw: string
  try {
    const response = await fetch(SEND_URL, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${user}:${password}`).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        msgheader: process.env.NETGSM_HEADER || DEFAULT_HEADER,
        messages: [{ msg: message, no: number }],
      }),
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    })
    raw = await response.text()
  } catch (error) {
    // Yalnizca hata turu yazilir; istek ayrintisi (baslik, govde) kayda girmez.
    console.error("SMS network error:", error instanceof Error ? error.name : "unknown")
    return failed("network_error")
  }

  let reply: { code?: unknown; jobid?: unknown; description?: unknown }
  try {
    reply = JSON.parse(raw)
  } catch {
    console.error("SMS provider returned an unreadable response")
    return failed("invalid_response")
  }

  const code = typeof reply?.code === "string" || typeof reply?.code === "number" ? String(reply.code) : ""
  if (!code) return failed("invalid_response")

  const sent = code === "00" || code === "01"
  const detail = sent ? reply.jobid : reply.description
  const reference = `${code} ${detail ?? ""}`.trim().slice(0, 200)

  if (!sent) console.error("SMS provider rejected message:", reference)
  return { sent, code, reference }
}
