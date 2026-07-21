import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { sendTelegramMessage, escapeHtml } from "@/lib/telegram"

// Randevu tipi kisa etiketleri (ozetlerde gostermek icin)
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

// Turkiye saati (UTC+3, yaz saati yok) icin gunun tarihini YYYY-MM-DD dondurur
export function istanbulDate(offsetDays = 0): string {
  const now = new Date()
  const tr = new Date(now.getTime() + 3 * 60 * 60 * 1000)
  tr.setUTCDate(tr.getUTCDate() + offsetDays)
  return tr.toISOString().split("T")[0]
}

// Turkiye'de su anki saat (0-23)
export function istanbulHour(): number {
  const now = new Date()
  const tr = new Date(now.getTime() + 3 * 60 * 60 * 1000)
  return tr.getUTCHours()
}

function dateLabelTr(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" })
}

function formatPhone(phone?: string | null): string {
  if (!phone) return ""
  return phone
}

// Tek bir randevu satiri (detayli: saat, isim, tip, telefon)
function apptLine(a: any, opts: { showPhone?: boolean } = {}): string {
  const time = (a.appointment_time || "").slice(0, 5)
  const name = a.patients?.full_name || "Hasta"
  const t = typeLabel(a)
  const typeSuffix = t ? ` <i>(${escapeHtml(t)})</i>` : ""
  let line = `• <b>${escapeHtml(time)}</b>  ${escapeHtml(name)}${typeSuffix}`
  if (opts.showPhone) {
    const phone = formatPhone(a.patients?.phone)
    if (phone) line += `\n   📞 ${escapeHtml(phone)}`
  }
  return line
}

export type ContentType = "today" | "tomorrow" | "unconfirmed" | "cancelled"

const SECTION_SELECT = `appointment_time, appointment_type, print_type, status, confirmation_status, link_clicked_at, patients (full_name, phone)`

/**
 * Belirli bir icerik turu icin baslik + satirlar dondurur.
 */
async function buildSection(type: ContentType): Promise<{ title: string; body: string; count: number }> {
  const supabase = await createServiceRoleClient()

  if (type === "today" || type === "tomorrow") {
    const dateStr = type === "today" ? istanbulDate(0) : istanbulDate(1)
    const label = type === "today" ? "BUGUNKU RANDEVULAR" : "YARINKI RANDEVULAR"
    const { data } = await supabase
      .from("appointments")
      .select(SECTION_SELECT)
      .eq("appointment_date", dateStr)
      .in("status", ["scheduled", "confirmed"])
      .order("appointment_time", { ascending: true })

    const appts = data || []
    const title = `📋 <b>${label}</b>\n${escapeHtml(dateLabelTr(dateStr))} — ${appts.length} randevu`
    if (appts.length === 0) return { title, body: "Randevu yok.", count: 0 }
    return { title, body: appts.map((a: any) => apptLine(a, { showPhone: true })).join("\n"), count: appts.length }
  }

  if (type === "unconfirmed") {
    // Yarinki randevulardan HALA onaylanmamis olanlar (hasta linke cevap vermemis)
    const dateStr = istanbulDate(1)
    const { data } = await supabase
      .from("appointments")
      .select(SECTION_SELECT)
      .eq("appointment_date", dateStr)
      .in("status", ["scheduled", "confirmed"])
      .or("confirmation_status.is.null,confirmation_status.eq.pending")
      .order("appointment_time", { ascending: true })

    const appts = data || []
    const title = `⚠️ <b>ONAYLANMAMIS RANDEVULAR</b>\n${escapeHtml(dateLabelTr(dateStr))} — ${appts.length} randevu\n<i>Hasta henuz teyit etmedi. Arayip teyit edin veya iptal edip yer acin.</i>`
    if (appts.length === 0) return { title, body: "Tum randevular onaylanmis.", count: 0 }
    return { title, body: appts.map((a: any) => apptLine(a, { showPhone: true })).join("\n"), count: appts.length }
  }

  // cancelled: hasta linke tiklayip "gelmeyecegim" dedigi icin bosalan slotlar (yarin)
  const dateStr = istanbulDate(1)
  const { data } = await supabase
    .from("appointments")
    .select(SECTION_SELECT)
    .eq("appointment_date", dateStr)
    .eq("status", "cancelled")
    .eq("confirmation_status", "cancelled")
    .order("appointment_time", { ascending: true })

  const appts = data || []
  const title = `🔴 <b>BOSALAN SLOTLAR (Hasta Iptal)</b>\n${escapeHtml(dateLabelTr(dateStr))} — ${appts.length} bosluk\n<i>Hasta gelmeyecegini bildirdi. Bu saatlere yeni hasta koyabilirsiniz.</i>`
  if (appts.length === 0) return { title, body: "Bosalan slot yok.", count: 0 }
  return { title, body: appts.map((a: any) => apptLine(a, { showPhone: true })).join("\n"), count: appts.length }
}

/**
 * Secilen icerik turlerini tek bir mesajda birlestirir.
 */
export async function buildDigestForTypes(types: ContentType[]): Promise<{ text: string; totalCount: number }> {
  const order: ContentType[] = ["today", "tomorrow", "unconfirmed", "cancelled"]
  const selected = order.filter((t) => types.includes(t))

  if (selected.length === 0) {
    return { text: "Icerik turu secilmemis.", totalCount: 0 }
  }

  const sections = await Promise.all(selected.map((t) => buildSection(t)))
  let totalCount = 0
  const parts = sections.map((s) => {
    totalCount += s.count
    return `${s.title}\n\n${s.body}`
  })

  return { text: parts.join("\n\n———————————\n\n"), totalCount }
}

/**
 * Geriye donuk uyumluluk: tek gun ozeti (test/onizleme icin).
 */
export async function buildDailyDigest(
  targetDate: Date,
  label: "yarin" | "bugun",
): Promise<{ text: string; count: number }> {
  const type: ContentType = label === "yarin" ? "tomorrow" : "today"
  const { text, totalCount } = await buildDigestForTypes([type])
  return { text, count: totalCount }
}

/**
 * Su anki Turkiye saatine denk gelen tum alicilara, sectikleri icerigi gonderir.
 * Saatlik cron tarafindan cagrilir.
 */
export async function sendDueDigests(forceHour?: number) {
  const supabase = await createServiceRoleClient()
  const hour = forceHour ?? istanbulHour()

  const { data: recipients, error } = await supabase
    .from("staff_recipients")
    .select("id, full_name, telegram_chat_id, content_today, content_tomorrow, content_unconfirmed, content_cancelled")
    .eq("is_active", true)
    .eq("send_hour", hour)

  if (error) {
    console.error("[v0] sendDueDigests recipients error:", error)
    throw new Error("Alicilar alinamadi")
  }

  if (!recipients || recipients.length === 0) {
    return { hour, sent: 0, failed: 0, message: "Bu saatte alici yok" }
  }

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const r of recipients) {
    const types: ContentType[] = []
    if (r.content_today) types.push("today")
    if (r.content_tomorrow) types.push("tomorrow")
    if (r.content_unconfirmed) types.push("unconfirmed")
    if (r.content_cancelled) types.push("cancelled")

    if (types.length === 0) continue
    if (!r.telegram_chat_id) {
      failed++
      errors.push(`${r.full_name}: chat_id yok`)
      continue
    }

    const { text } = await buildDigestForTypes(types)
    const res = await sendTelegramMessage(r.telegram_chat_id, text)
    if (res.success) sent++
    else {
      failed++
      errors.push(`${r.full_name}: ${res.error}`)
    }
  }

  return { hour, sent, failed, errors }
}
