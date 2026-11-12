// Python'ın sayı biçimlendirmesi. Eski sistemin yönergesi f"{x:.2f}" ve round(x, 3) ile
// kuruluyordu; aynı metni üretmek için yuvarlama kuralı da aynı olmalı.
//
// Fark yalnızca tam ortadaki değerlerde çıkar (0.125 gibi, ikilik tabanda tam gösterilebilen):
// Python en yakın ÇİFT basamağa yuvarlar ("0.12"), JavaScript toFixed büyüğe ("0.13").

/** Python: format(x, f".{digits}f") */
export function pyFixed(x: number, digits: number): string {
  if (!Number.isFinite(x)) return String(x)
  const fixed = x.toFixed(digits)

  // x, 2^(digits+1)'in katı değilse tam ortada olamaz; toFixed zaten doğru yuvarlar.
  const scaledBinary = x * 2 ** (digits + 1)
  if (!Number.isInteger(scaledBinary)) return fixed
  const doubled = Math.abs(x) * 10 ** digits * 2
  if (!Number.isInteger(doubled) || doubled % 2 === 0) return fixed

  // Tam ortada: iki komşudan son basamağı çift olanı seç.
  const lower = (doubled - 1) / 2
  const upper = (doubled + 1) / 2
  const pick = lower % 2 === 0 ? lower : upper
  const text = (pick / 10 ** digits).toFixed(digits)
  return x < 0 && pick !== 0 ? `-${text}` : text
}

/** Python: round(x, digits) */
export function pyRound(x: number, digits: number): number {
  return Number(pyFixed(x, digits))
}

/** Python: format(x, ".0%") */
export function pyPercent0(x: number): string {
  return `${pyFixed(x * 100, 0)}%`
}

/** Python: float(v or 0) — sayı değilse, boşsa ya da okunamıyorsa 0. */
export function pyFloat(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (typeof value === "string") {
    const n = Number.parseFloat(value)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}
