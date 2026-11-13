// Uygulamadan alınabilen randevu türleri ve saat ızgarası. Yalnızca düz veri ve saf işlevler:
// hem sunucu hem tarayıcı kullanır. Tür kimlikleri sitedeki randevu sayfasıyla aynıdır
// (components/appointment-type-selector.tsx); personel ekranları bu kimlikleri tanır.

export const BOOKING_TYPES = [
  { id: "gebelik-takibi", title: "Gebelik takibi", hint: "Rutin kontrol ve ultrason", tone: "pink" },
  { id: "ayrintili-fetal-ultrason", title: "Ayrıntılı ultrason", hint: "2. düzey fetal ultrason", tone: "lilac" },
  { id: "kontrol-takip", title: "Kontrol", hint: "Sonuç gösterme, takip", tone: "peach" },
  { id: "jinekolojik-muayene", title: "Jinekolojik muayene", hint: "Kadın hastalıkları", tone: "plain" },
] as const

export type BookingTypeId = (typeof BOOKING_TYPES)[number]["id"]

export function isBookingType(value: unknown): value is BookingTypeId {
  return typeof value === "string" && BOOKING_TYPES.some((t) => t.id === value)
}

export function bookingTypeTitle(id: string | null | undefined): string {
  return BOOKING_TYPES.find((t) => t.id === id)?.title ?? "Randevu"
}

/** Ayrıntılı ultrasonda sorulan bebek sayısı (sitedeki değerlerin aynısı). */
export const FETAL_COUNTS = [
  { id: "tek", label: "Tek bebek" },
  { id: "ikiz", label: "İkiz" },
  { id: "ucuz", label: "Üçüz" },
] as const

export type FetalCount = (typeof FETAL_COUNTS)[number]["id"]

export function isFetalCount(value: unknown): value is FetalCount {
  return typeof value === "string" && FETAL_COUNTS.some((c) => c.id === value)
}

/** Bugün için en erken alınabilecek saat: şimdiden bu kadar dakika sonrası. */
export const SAME_DAY_LEAD_MINUTES = 30

/** Kaç gün ilerisine kadar randevu gösterilir. */
export const BOOKING_HORIZON_DAYS = 60

export function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function timeOf(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
}

/**
 * Bir günün programından randevu saatleri. Sitedeki takvimle aynı kural
 * (components/weekly-calendar.tsx generateTimeSlots): 15 dakikalık ızgara, başlangıç yukarı,
 * bitiş aşağı yuvarlanır, bitiş saati dahildir. Ayrıntılı ultrason yalnızca tam ve buçuklarda.
 */
export function slotTimes(startTime: string, endTime: string, type: string): string[] {
  const start = Math.ceil(minutesOf(startTime) / 15) * 15
  const end = Math.floor(minutesOf(endTime) / 15) * 15
  const halfHourOnly = type === "ayrintili-fetal-ultrason"
  const times: string[] = []
  for (let t = start; t <= end; t += 15) {
    if (!halfHourOnly || t % 30 === 0) times.push(timeOf(t))
  }
  return times
}

const DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"]
const DAYS_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"]
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]

/** Haftanın günü (0 = Pazar); saat diliminden bağımsız. */
export function weekdayOf(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/** "2026-11-20" -> { day: 20, weekday: "Cuma", short: "Cum", month: "Kasım" } */
export function dateParts(iso: string) {
  const [, m, d] = iso.split("-").map(Number)
  const weekday = weekdayOf(iso)
  return { day: d, weekday: DAYS[weekday], short: DAYS_SHORT[weekday], month: MONTHS[m - 1] }
}

/** "2026-11-20" -> "20 Kasım Cuma" */
export function formatDayTr(iso: string): string {
  const p = dateParts(iso)
  return `${p.day} ${p.month} ${p.weekday}`
}
