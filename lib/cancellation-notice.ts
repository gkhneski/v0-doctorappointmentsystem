import type { SupabaseClient } from "@supabase/supabase-js"
import { sendTelegramMessage, escapeHtml } from "@/lib/telegram"

export type CancellationDetails = {
  patient_name?: string | null
  patient_phone?: string | null
  appointment_date?: string | null
  appointment_time?: string | null
  /** İptalin geldiği yer; başlıkta gösterilir. */
  source?: "link" | "app"
}

/**
 * Hasta randevusunu iptal edince (SMS bağlantısından ya da hasta uygulamasından) tüm etkin
 * Telegram alıcılarına anlık haber verir. Hata fırlatmaz: bildirim, iptali engellememeli.
 */
export async function notifyStaffOfCancellation(supabase: SupabaseClient, details: CancellationDetails): Promise<void> {
  try {
    const { data: recipients } = await supabase
      .from("staff_recipients")
      .select("full_name, telegram_chat_id")
      .eq("is_active", true)
      .not("telegram_chat_id", "is", null)

    if (!recipients?.length) return

    const dateLabel = details.appointment_date
      ? new Date(details.appointment_date + "T12:00:00").toLocaleDateString("tr-TR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : "-"
    const timeLabel = details.appointment_time ? String(details.appointment_time).slice(0, 5) : "-"
    const title = details.source === "app" ? "Randevu İptali (Hasta Uygulaması)" : "Randevu İptali (Hasta Bildirimi)"

    const text =
      `<b>❌ ${title}</b>\n\n` +
      `Hasta: <b>${escapeHtml(details.patient_name || "Bilinmeyen Hasta")}</b>\n` +
      `Telefon: ${escapeHtml(details.patient_phone || "-")}\n` +
      `Tarih: ${escapeHtml(dateLabel)}\n` +
      `Saat: <b>${escapeHtml(timeLabel)}</b>\n\n` +
      `Bu saat takvimde dolu görünmeye devam ediyor. Yerine yeni hasta vermek için admin panelini kullanın.`

    await Promise.all(
      recipients.filter((r) => r.telegram_chat_id).map((r) => sendTelegramMessage(String(r.telegram_chat_id), text)),
    )
  } catch (err: unknown) {
    console.error("Telegram cancellation notify error:", err instanceof Error ? err.message : err)
  }
}
