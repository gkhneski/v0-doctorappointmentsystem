// Yazdirma tipleri: randevu detay paneli ve Hizli Ajanda Bloke ayni listeyi kullanir.
// Deger veritabanina (appointments.print_type) aynen yazilir ve takvimde/listede gosterilir.
export const PRINT_TYPES = [
  "IVF kontrol",
  "IUI kontrol",
  "DET kontrol",
  "Endom kontrol",
  "Klomen takip",
  "OP sonrası kontrol",
  "Serklaj sonrası kontrol",
  "Sonuç",
  "G.M",
  "DTY",
  "Gebelik istemi",
  "Mens",
  "Mens IUI",
  "Mens IVF",
  "Mens DET",
  "Gebe kontrol",
  "Gebe muayene",
  "Negatif IVF",
  "Negatif IUI",
  "D21",
  "Kontrol",
  "Amniyosentez sonrası k.",
  "Kürtaj sonrası k.",
  "OHSS kontrol",
  "Kese kontrol",
  "C/S sonrası kontrol",
  "Kist kontrol",
  "Akıntı kontrol",
  "No mens",
  "İşlem",
] as const

// Buyuk/kucuk harf ve Turkce karakter farkini yok sayan anahtar
function foldKey(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/\s+/g, " ")
    .trim()
}

const CANONICAL_BY_KEY = new Map<string, string>(PRINT_TYPES.map((t) => [foldKey(t), t]))
CANONICAL_BY_KEY.set(foldKey("Amniosentez sonrasi k."), "Amniyosentez sonrası k.")

// Eski kayitlardaki yazimlari ("det kontrol", "OP sonrasi kontrol" vb.) listedeki karsiligina cevirir.
// Listede olmayan bir deger aynen dondurulur.
export function normalizePrintType(value: string | null | undefined): string {
  if (!value) return ""
  return CANONICAL_BY_KEY.get(foldKey(value)) ?? value
}
