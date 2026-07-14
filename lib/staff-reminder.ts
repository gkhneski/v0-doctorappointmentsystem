import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { sendWhatsAppTemplate } from "@/lib/whatsapp"

// Randevu tipi kisa etiketleri (WhatsApp ozetinde gostermek icin)
const TYPE_SHORT_LABELS: Record<string, string> = {
  "ilk-muayene": "Ilk Muayene",
  "kontrol-takip": "Kontrol",
  "gebelik-istemi-infertilite": "Gebelik Istemi",
  "jinekolojik-muayene": "Jinekolojik",
  "ayrintili-fetal-ultrason": "Fetal USG",
  "gebelik-takibi": "Gebe Takip",
  "asilik-tup-bebek": "Asilama/Tup Bebek",
  "iui-kontrol": "IUI Kontrol",
  "op-sonrasi-kontrol": "Op Sonrasi",
  "serklaj-sonrasi-kontrol": "Serklaj Sonrasi",
  "gebe-muayene": "Gebe Muayene",
  "acil-durum": "Acil",
  dty: "DTY",
  mens: "Mens",
  diger: "Diger",
}

function typeLabel(appt: { appointment_type?: string; print_type?: string | null }): string {
  if (appt.print_type && appt.print_type !== "") return appt.print_type
  if (!appt.appointment_type) return ""
  return TYPE_SHORT_LABELS[appt.appointment_type] || appt.appointment_type.replace(/-/g, " ")
}

function toYMD(d: Date): string {
  return d.toISOString().split("T")[0]
}

/**
 * Belirtilen gun icin randevu ozet metni olusturur.
 * WhatsApp sablonu tek satir parametre bekledigi icin " | " ile ayrilir.
 */
export async function buildDailyDigest(
  targetDate: Date,
  label: "yarin" | "bugun",
): Promise<{ text: string; count: number }> {
  const supabase = await createServiceRoleClient()
  const dateStr = toYMD(targetDate)

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(`appointment_time, appointment_type, print_type, patients (full_name)`)
    .eq("appointment_date", dateStr)
    .in("status", ["scheduled", "confirmed"])
    .order("appointment_time", { ascending: true })

  if (error) {
    console.error("[v0] Digest fetch error:", error)
    throw new Error("Randevular alinamadi")
  }

  const dateLabelTr = targetDate.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
  })

  if (!appointments || appointments.length === 0) {
    return {
      text: `${dateLabelTr} (${label}) icin randevu bulunmuyor.`,
      count: 0,
    }
  }

  const items = appointments.map((a: any) => {
    const time = (a.appointment_time || "").slice(0, 5)
    const name = a.patients?.full_name || "Hasta"
    const t = typeLabel(a)
    return t ? `${time} ${name} (${t})` : `${time} ${name}`
  })

  const header = `${dateLabelTr} - ${appointments.length} randevu:`
  const text = `${header} ${items.join(" | ")}`

  return { text, count: appointments.length }
}

/**
 * Personel alicilarina (staff_recipients) gunun ozetini WhatsApp ile gonderir.
 * which = "evening" -> receive_evening true olanlar (yarinki liste)
 * which = "morning" -> receive_morning true olanlar (bugunku liste)
 */
export async function sendStaffDigest(which: "evening" | "morning") {
  const supabase = await createServiceRoleClient()

  const now = new Date()
  const target = new Date(now)
  if (which === "evening") {
    target.setDate(now.getDate() + 1) // yarin
  }
  const label = which === "evening" ? "yarin" : "bugun"

  const { text, count } = await buildDailyDigest(target, label)

  const column = which === "evening" ? "receive_evening" : "receive_morning"
  const { data: recipients, error } = await supabase
    .from("staff_recipients")
    .select("id, full_name, phone")
    .eq("is_active", true)
    .eq(column, true)

  if (error) {
    console.error("[v0] Staff recipients fetch error:", error)
    throw new Error("Alicilar alinamadi")
  }

  if (!recipients || recipients.length === 0) {
    return { sent: 0, failed: 0, appointmentCount: count, message: "Alici yok" }
  }

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const r of recipients) {
    const res = await sendWhatsAppTemplate(r.phone, text)
    if (res.success) {
      sent++
    } else {
      failed++
      errors.push(`${r.full_name}: ${res.error}`)
    }
  }

  return { sent, failed, appointmentCount: count, errors }
}
