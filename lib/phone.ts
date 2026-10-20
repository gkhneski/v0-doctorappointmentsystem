// Telefon numaralari icin TEK kural. Hem sunucu hem tarayici tarafinda kullanilabilir.
//
// Veritabaninda TR cep telefonlari her zaman "05XXXXXXXXX" (11 hane) olarak tutulur.
// Kabul edilen girisler: "0532 123 45 67", "532-123-4567", "+90 532 123 45 67",
// "905321234567", "0090 532 ..." -> hepsi "05321234567" olur.
// TR cep olmayan numaralar (sabit hat, yurt disi) rakam olarak aynen tutulur.

/** Hizli blok gibi yerlerde "telefon yok" anlamina gelen yer tutucu. */
export const PLACEHOLDER_PHONE = "0000000000"

function digitsOf(input: string | null | undefined): string {
  return String(input ?? "").replace(/\D/g, "")
}

/** Telefonu veritabani bicimine cevirir. Bos/yer tutucu icin "" doner. */
export function normalizePhone(input: string | null | undefined): string {
  let d = digitsOf(input)
  if (!d || /^0+$/.test(d)) return ""

  if (d.startsWith("00")) d = d.slice(2) // 0090... -> 90...
  if (/^905\d{9}$/.test(d)) return "0" + d.slice(2)
  if (/^5\d{9}$/.test(d)) return "0" + d
  if (/^05\d{9}$/.test(d)) return d

  // Yurt disi veya sabit hat: dokunma (sadece rakamlar)
  return digitsOf(input)
}

/** Kayitta gercek bir telefon var mi? (bos / "0000000000" degil) */
export function hasPhone(input: string | null | undefined): boolean {
  return normalizePhone(input) !== ""
}

/** SMS gonderilebilir bir TR cep telefonu mu? */
export function isSmsablePhone(input: string | null | undefined): boolean {
  return /^05\d{9}$/.test(normalizePhone(input))
}

/** NETGSM "gsmno" parametresi: "5XXXXXXXXX". SMS gonderilemezse null. */
export function toNetgsmNumber(input: string | null | undefined): string | null {
  const n = normalizePhone(input)
  return /^05\d{9}$/.test(n) ? n.slice(1) : null
}

/**
 * Eski kayitlar farkli bicimlerde olabildigi icin, telefonla hasta ararken
 * butun olasi yazilislari dondurur (".in('phone', phoneVariants(x))").
 */
export function phoneVariants(input: string | null | undefined): string[] {
  const n = normalizePhone(input)
  if (!n) return []
  if (!/^05\d{9}$/.test(n)) return [n]
  const ten = n.slice(1)
  return [n, ten, "90" + ten, "+90" + ten]
}
