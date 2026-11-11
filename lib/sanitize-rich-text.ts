import DOMPurify from "dompurify"

// Zengin metin düzenleyicilerinin araç çubuğu yalnızca bunları üretir:
// kalın, italik, altı çizili, yazı rengi, vurgu rengi, madde ve numara listesi.
const ALLOWED_TAGS = ["b", "strong", "i", "em", "u", "span", "font", "div", "p", "br", "ul", "ol", "li"]
const ALLOWED_ATTR = ["style", "color"]

/**
 * Veritabanında kayıtlı HTML'i düzenleyiciye yüklemeden önce süzer. Kayıt başka bir yoldan
 * (ör. doğrudan API ile) yazılmış olsa bile betik, olay özniteliği, bağlantı ve gömülü içerik
 * personelin tarayıcısında çalışmaz. Yalnızca tarayıcıda çalışır; sunucuda boş metin döner.
 */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html || typeof window === "undefined") return ""
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
}
