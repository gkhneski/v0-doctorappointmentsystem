// İsim bulucudaki isimler. Yalnızca yaygın kullanılan ve anlamı tartışmasız olan isimler
// alındı; liste zamanla genişletilir. Anlamlar gündelik karşılıklarıdır.
//
// DURUM: listeyi kullanıcı (Gökhan) gözden geçirecek.

export type NameKind = "kiz" | "erkek" | "ortak"

export type BabyName = {
  name: string
  meaning: string
  kind: NameKind
}

export const KIND_LABEL: Record<NameKind, string> = {
  kiz: "Kız",
  erkek: "Erkek",
  ortak: "Kız ya da erkek",
}

export const NAMES: readonly BabyName[] = [
  { name: "Deniz", meaning: "deniz", kind: "ortak" },
  { name: "Elif", meaning: "ince, uzun; alfabenin ilk harfi", kind: "kiz" },
  { name: "Aras", meaning: "Doğu Anadolu'daki ırmağın adı", kind: "erkek" },
  { name: "Defne", meaning: "defne ağacı", kind: "kiz" },
  { name: "Güneş", meaning: "güneş", kind: "ortak" },
  { name: "Kaan", meaning: "hükümdar", kind: "erkek" },
  { name: "Nehir", meaning: "nehir", kind: "kiz" },
  { name: "Umut", meaning: "umut", kind: "ortak" },
  { name: "Çınar", meaning: "çınar ağacı", kind: "erkek" },
  { name: "Ada", meaning: "ada", kind: "kiz" },
  { name: "Doruk", meaning: "dağın en yüksek yeri", kind: "erkek" },
  { name: "Yağmur", meaning: "yağmur", kind: "ortak" },
  { name: "Ilgın", meaning: "ılgın ağacı", kind: "kiz" },
  { name: "Bulut", meaning: "bulut", kind: "erkek" },
  { name: "Derin", meaning: "derin", kind: "ortak" },
  { name: "Ceren", meaning: "ceylan", kind: "kiz" },
  { name: "Toprak", meaning: "toprak", kind: "ortak" },
  { name: "Yiğit", meaning: "yürekli, cesur", kind: "erkek" },
  { name: "Gül", meaning: "gül", kind: "kiz" },
  { name: "Barış", meaning: "barış", kind: "erkek" },
  { name: "Ekin", meaning: "ekilmiş tahıl", kind: "ortak" },
  { name: "Lale", meaning: "lale", kind: "kiz" },
  { name: "Ozan", meaning: "halk şairi", kind: "erkek" },
  { name: "Bahar", meaning: "bahar", kind: "kiz" },
]

const NAME_SET = new Set(NAMES.map((n) => n.name))

export function isKnownName(value: unknown): value is string {
  return typeof value === "string" && NAME_SET.has(value)
}
