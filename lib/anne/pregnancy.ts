// Gebelik haftası hesabı. Yalnızca takvim aritmetiği yapar; tıbbi değerlendirme yapmaz.
// Tüm tarihler saat içermeyen "YYYY-AA-GG" metinleridir; saat dilimi kayması olmasın diye
// hesaplar UTC gün sayısı üzerinden yapılır.

/** Son adet tarihinden tahmini doğum tarihine: 280 gün (40 hafta). */
export const PREGNANCY_DAYS = 280
/** Bu günden eski bir son adet tarihi kabul edilmez (44 hafta). */
export const MAX_PREGNANCY_DAYS = 308

const DAY_MS = 86_400_000
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** "YYYY-AA-GG" geçerli bir takvim günü mü? (2026-02-30 gibi olmayan günler reddedilir.) */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false
  const m = ISO_DATE.exec(value)
  if (!m) return false
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3]
}

function toDayNumber(iso: string): number {
  const m = ISO_DATE.exec(iso)!
  return Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY_MS)
}

function fromDayNumber(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10)
}

export function addDays(iso: string, days: number): string {
  return fromDayNumber(toDayNumber(iso) + days)
}

export function daysBetween(fromIso: string, toIso: string): number {
  return toDayNumber(toIso) - toDayNumber(fromIso)
}

/** İstanbul'da bugünün tarihi. */
export function todayInIstanbul(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(now)
}

export function dueDateFromLmp(lmp: string): string {
  return addDays(lmp, PREGNANCY_DAYS)
}

export function lmpFromDueDate(dueDate: string): string {
  return addDays(dueDate, -PREGNANCY_DAYS)
}

export type PregnancyStart =
  | { ok: true; lmp: string; dueDate: string; source: "lmp" | "due" }
  | { ok: false; error: string }

/**
 * Hastanın girdiği tek tarihten (son adet ya da tahmini doğum) ikisini de üretir.
 * Gelecekteki bir son adet tarihi ya da 44 haftadan eski bir gebelik kabul edilmez.
 */
export function resolvePregnancyStart(
  input: { lmp?: unknown; dueDate?: unknown },
  today: string,
): PregnancyStart {
  const hasLmp = input.lmp !== undefined && input.lmp !== null && input.lmp !== ""
  const hasDue = input.dueDate !== undefined && input.dueDate !== null && input.dueDate !== ""

  if (hasLmp === hasDue) {
    return { ok: false, error: "Son adet tarihinizi ya da tahmini doğum tarihinizi girin (yalnızca birini)." }
  }

  const raw = hasLmp ? input.lmp : input.dueDate
  if (!isIsoDate(raw)) return { ok: false, error: "Geçerli bir tarih girin." }

  const lmp = hasLmp ? raw : lmpFromDueDate(raw)
  const elapsed = daysBetween(lmp, today)

  if (elapsed < 0) {
    return {
      ok: false,
      error: hasLmp ? "Son adet tarihi gelecekte olamaz." : "Tahmini doğum tarihi 40 haftadan uzak olamaz.",
    }
  }
  if (elapsed > MAX_PREGNANCY_DAYS) {
    return {
      ok: false,
      error: hasLmp ? "Son adet tarihi 44 haftadan eski olamaz." : "Tahmini doğum tarihi 4 haftadan fazla geçmiş olamaz.",
    }
  }

  return { ok: true, lmp, dueDate: dueDateFromLmp(lmp), source: hasLmp ? "lmp" : "due" }
}

export type GestationalAge = {
  /** Son adet tarihinden bugüne geçen gün. */
  days: number
  /** Tamamlanan hafta (12 hafta 3 gün için 12). */
  weeks: number
  /** Haftanın içindeki gün, 0–6. */
  extraDays: number
  /** 1, 2 ya da 3. */
  trimester: 1 | 2 | 3
  /** Tahmini doğum tarihine kalan gün; geçtiyse eksi. */
  daysToDue: number
  /** 0–100, gebeliğin ne kadarı geçti. */
  progressPercent: number
}

/** Bugünkü gebelik haftası. `today`, son adet tarihinden önceyse null döner. */
export function gestationalAge(lmp: string, today: string): GestationalAge | null {
  const days = daysBetween(lmp, today)
  if (days < 0) return null
  const weeks = Math.floor(days / 7)
  return {
    days,
    weeks,
    extraDays: days % 7,
    // 14. haftanın başına kadar ilk, 28. haftanın başına kadar ikinci üç aylık dönem.
    trimester: weeks < 14 ? 1 : weeks < 28 ? 2 : 3,
    daysToDue: PREGNANCY_DAYS - days,
    progressPercent: Math.min(100, Math.round((days / PREGNANCY_DAYS) * 100)),
  }
}

/** "12 hafta 3 gün" / "12 hafta". */
export function formatGestationalAge(age: Pick<GestationalAge, "weeks" | "extraDays">): string {
  return age.extraDays === 0 ? `${age.weeks} hafta` : `${age.weeks} hafta ${age.extraDays} gün`
}

/** Belirli bir gebelik haftasının (tamamlanan hafta) başladığı takvim günü. */
export function dateOfWeekStart(lmp: string, week: number): string {
  return addDays(lmp, week * 7)
}
