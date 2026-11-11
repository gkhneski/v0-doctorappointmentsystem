import type { UIMessage } from "ai"

export const MAX_CHAT_MESSAGES = 30
export const MAX_USER_TEXT = 1000

/**
 * Tarayıcıdan gelen sohbet geçmişini süzer:
 * - yalnızca "user" ve "assistant" rolleri (istemci "system" iletisiyle yönergeyi değiştiremez),
 * - kullanıcı iletilerinde yalnızca metin, en çok MAX_USER_TEXT karakter,
 * - en çok son MAX_CHAT_MESSAGES ileti.
 * Asistan iletileri (araç çağrısı geçmişi dahil) aynen korunur; sohbetin devamı için gereklidir.
 */
export function sanitizeChatMessages(raw: unknown): UIMessage[] {
  if (!Array.isArray(raw)) return []

  const cleaned: UIMessage[] = []
  for (const message of raw) {
    if (!message || typeof message !== "object" || !Array.isArray(message.parts)) continue

    if (message.role === "assistant") {
      cleaned.push(message as UIMessage)
    } else if (message.role === "user") {
      const parts = message.parts
        .filter((p: any) => p && p.type === "text" && typeof p.text === "string")
        .map((p: any) => ({ type: "text" as const, text: p.text.slice(0, MAX_USER_TEXT) }))
      if (parts.length > 0) cleaned.push({ ...message, parts } as UIMessage)
    }
  }

  return cleaned.slice(-MAX_CHAT_MESSAGES)
}
