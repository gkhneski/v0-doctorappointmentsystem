// WhatsApp Cloud API (Meta resmi) gonderim yardimcisi.
//
// Gerekli ortam degiskenleri:
//   WHATSAPP_TOKEN            -> Meta kalici erisim tokeni (System User token onerilir)
//   WHATSAPP_PHONE_NUMBER_ID  -> Cloud API telefon numarasi ID (numara degil, ID)
//   WHATSAPP_TEMPLATE_NAME    -> Onayli sablon adi (isletme baslatan mesaj icin zorunlu)
//   WHATSAPP_TEMPLATE_LANG    -> Sablon dil kodu (varsayilan: tr)
//
// Not: WhatsApp kurallari geregi, kullanici son 24 saatte yazmadiysa
// sadece ONAYLI SABLON gonderilebilir. Bu yuzden varsayilan olarak sablon modu kullanilir.

const GRAPH_VERSION = "v21.0"

type WhatsAppResult = {
  success: boolean
  to: string
  error?: string
  id?: string
}

// Telefonu WhatsApp'in bekledigi uluslararasi formata cevirir (ornek: 905xxxxxxxxx)
export function normalizeWhatsAppPhone(raw: string): string {
  let digits = (raw || "").replace(/\D/g, "")
  if (!digits) return ""
  // Bastaki 00'i temizle
  if (digits.startsWith("00")) digits = digits.slice(2)
  // 0 ile baslayan yerel numara (05xx...) -> 90 ekle
  if (digits.startsWith("0")) digits = "90" + digits.slice(1)
  // 10 haneli (5xx...) -> 90 ekle
  if (digits.length === 10 && digits.startsWith("5")) digits = "90" + digits
  return digits
}

/**
 * Onayli bir WhatsApp sablonunu tek bir body parametresiyle gonderir.
 * Sablonun govdesinde tek bir {{1}} degiskeni bulunmalidir.
 */
export async function sendWhatsAppTemplate(
  toRaw: string,
  bodyParam: string,
): Promise<WhatsAppResult> {
  const token = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME
  const lang = process.env.WHATSAPP_TEMPLATE_LANG || "tr"

  const to = normalizeWhatsAppPhone(toRaw)

  if (!token || !phoneNumberId) {
    return { success: false, to, error: "WHATSAPP_TOKEN veya WHATSAPP_PHONE_NUMBER_ID tanimli degil" }
  }
  if (!templateName) {
    return { success: false, to, error: "WHATSAPP_TEMPLATE_NAME tanimli degil" }
  }
  if (!to) {
    return { success: false, to, error: "Gecersiz telefon numarasi" }
  }

  // WhatsApp sablon parametrelerinde satir atlama/sekme yasak; tek satira indir
  const cleanParam = bodyParam.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim()

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: lang },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: cleanParam }],
        },
      ],
    },
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      const msg = data?.error?.message || `HTTP ${res.status}`
      console.error("[v0] WhatsApp send error:", msg)
      return { success: false, to, error: msg }
    }
    const id = data?.messages?.[0]?.id
    console.log("[v0] WhatsApp sent:", to, id)
    return { success: true, to, id }
  } catch (error: any) {
    console.error("[v0] WhatsApp fetch error:", error?.message)
    return { success: false, to, error: error?.message || "Network error" }
  }
}
