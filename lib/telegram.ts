// Telegram Bot API gonderim yardimcisi.
//
// Gerekli ortam degiskeni:
//   TELEGRAM_BOT_TOKEN -> @BotFather'dan alinan bot tokeni
//
// Kurulum:
//   1. Telegram'da @BotFather ile yeni bot olustur, tokeni al.
//   2. Her alici (doktor, sekreter) bota bir kez /start yazsin.
//   3. Admin panelinden "Chat ID'leri Bul" ile chat_id otomatik cekilir.
//
// Telegram'da sablon onayi, numara ya da ban derdi yoktur; cok satirli mesaj serbesttir.

type TelegramResult = {
  success: boolean
  chatId: string
  error?: string
  messageId?: number
}

// HTML parse_mode icin ozel karakterleri kacir
export function escapeHtml(text: string): string {
  return (text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

/**
 * Belirtilen chat_id'ye Telegram mesaji gonderir.
 * Mesaj HTML parse_mode ile gonderilir (kalin baslik vb. icin).
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN

  if (!token) {
    return { success: false, chatId, error: "TELEGRAM_BOT_TOKEN tanimli degil" }
  }
  if (!chatId) {
    return { success: false, chatId, error: "Gecersiz chat_id" }
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    })
    const data = await res.json()
    if (!res.ok || !data.ok) {
      const msg = data?.description || `HTTP ${res.status}`
      console.log("[v0] Telegram send error:", msg)
      return { success: false, chatId, error: msg }
    }
    console.log("[v0] Telegram sent:", chatId, data?.result?.message_id)
    return { success: true, chatId, messageId: data?.result?.message_id }
  } catch (error: any) {
    console.log("[v0] Telegram fetch error:", error?.message)
    return { success: false, chatId, error: error?.message || "Network error" }
  }
}

/**
 * Bota /start yazan kisilerin chat_id'lerini getirir (getUpdates).
 * Admin panelinde "Chat ID'leri Bul" icin kullanilir.
 * Donen liste: { name, username, chatId }
 */
export async function getTelegramChats(): Promise<
  { chatId: string; name: string; username?: string }[]
> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN tanimli degil")

  const url = `https://api.telegram.org/bot${token}/getUpdates`
  const res = await fetch(url, { cache: "no-store" })
  const data = await res.json()
  if (!data.ok) throw new Error(data?.description || "getUpdates basarisiz")

  const seen = new Map<string, { chatId: string; name: string; username?: string }>()
  for (const upd of data.result || []) {
    const msg = upd.message || upd.edited_message || upd.channel_post
    const chat = msg?.chat
    if (!chat) continue
    const chatId = String(chat.id)
    const name =
      chat.title ||
      [chat.first_name, chat.last_name].filter(Boolean).join(" ") ||
      chat.username ||
      chatId
    seen.set(chatId, { chatId, name, username: chat.username })
  }
  return Array.from(seen.values())
}
