/**
 * Türkiye'de kullanılan tarih formatting utility'leri
 * Timezone shift problemi çözmek için local date kullan
 */

/**
 * Date objesini "YYYY-MM-DD" string'ine convert et (timezone problemi olmadan)
 * @param date Date objesı
 * @returns "2026-02-02" formatında string
 */
export function formatDateForDB(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * "YYYY-MM-DD" string'ini Date objesine convert et
 * @param dateString "2026-02-02" formatında string
 * @returns Date objesi (local timezone'da)
 */
export function parseDBDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day)
}

/**
 * İki tarih arasındaki gün sayısını hesapla
 * @param date1 Başlangıç tarihi
 * @param date2 Bitiş tarihi
 * @returns Gün sayısı
 */
export function getDaysDifference(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000
  return Math.round((date2.getTime() - date1.getTime()) / oneDay)
}

/**
 * Verilen tarihin gün adını Türkçe olarak döndür
 * @param date Date objesi
 * @returns "Pazartesi", "Salı", etc.
 */
export function getTurkishDayName(date: Date): string {
  const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"]
  return days[date.getDay()]
}

/**
 * Verilen tarihi Türkçe formatında döndür
 * @param date Date objesi
 * @returns "02 Şubat" formatında string
 */
export function formatTurkishDate(date: Date): string {
  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ]
  const day = date.getDate()
  const month = months[date.getMonth()]
  return `${day} ${month}`
}
