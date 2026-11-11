import type { UIMessage } from "ai"

export const MAX_CHAT_MESSAGES = 30
export const MAX_USER_TEXT = 1000
export const MAX_ASSISTANT_TEXT = 4000
/** Sohbet geçmişinin tamamı için üst sınır (JSON karakteri). Aşılırsa istek reddedilir. */
export const MAX_CHAT_CHARS = 100_000

// Asistan iletisinde kabul edilen parça türleri: metin, adım işareti ve bu yolun kendi iki aracı.
const ASSISTANT_PART_TYPES = new Set(["text", "step-start", "tool-getAvailableSlots", "tool-selectSlot"])

/**
 * Tarayıcıdan gelen sohbet geçmişini süzer:
 * - toplam boyut MAX_CHAT_CHARS'ı aşarsa boş döner (istek reddedilir),
 * - yalnızca "user" ve "assistant" rolleri (istemci "system" iletisiyle yönergeyi değiştiremez),
 * - kullanıcı iletilerinde yalnızca metin, en çok MAX_USER_TEXT karakter,
 * - asistan iletilerinde yalnızca bilinen parça türleri; metin en çok MAX_ASSISTANT_TEXT karakter,
 * - en çok son MAX_CHAT_MESSAGES ileti; ilk ileti her zaman kullanıcıya aittir.
 */
export function sanitizeChatMessages(raw: unknown): UIMessage[] {
  if (!Array.isArray(raw)) return []
  try {
    if (JSON.stringify(raw).length > MAX_CHAT_CHARS) return []
  } catch {
    return []
  }

  const cleaned: UIMessage[] = []
  for (const message of raw) {
    if (!message || typeof message !== "object" || !Array.isArray(message.parts)) continue

    if (message.role === "assistant") {
      const parts = message.parts
        .filter((p: any) => p && ASSISTANT_PART_TYPES.has(p.type))
        .map((p: any) =>
          p.type === "text" ? { ...p, text: String(p.text ?? "").slice(0, MAX_ASSISTANT_TEXT) } : p,
        )
      if (parts.length > 0) cleaned.push({ ...message, parts } as UIMessage)
    } else if (message.role === "user") {
      const parts = message.parts
        .filter((p: any) => p && p.type === "text" && typeof p.text === "string")
        .map((p: any) => ({ type: "text" as const, text: p.text.slice(0, MAX_USER_TEXT) }))
      if (parts.length > 0) cleaned.push({ ...message, parts } as UIMessage)
    }
  }

  const recent = cleaned.slice(-MAX_CHAT_MESSAGES)
  const firstUser = recent.findIndex((m) => m.role === "user")
  return firstUser === -1 ? [] : recent.slice(firstUser)
}
