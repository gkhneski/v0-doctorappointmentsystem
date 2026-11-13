import type { SourceKey } from "@/lib/anne/content/sources"

// "Havuç mu, lahana mı?" oyununun yiyecek ve içecek listesi.
//
// Liste üç araştırmayla kuruldu (13.11.2026):
//   * Türk annelerin forumlarda en çok andığı yiyecekler (erik, turşu, karpuz, çikolata, limon...).
//   * Gebelikte önerilmeyenler listeye ALINMADI: alkol, çiğ ya da az pişmiş et (çiğ etli çiğ köfte),
//     çiğ balık, rafadan yumurta, çiğ süt ve ürünleri, ciğer, pastırma gibi pişmemiş işlenmiş etler,
//     enerji içeceği, papatya ve adaçayı gibi önerilmeyen bitki çayları.
//   * Bilim: bebeğin yüz ifadesi yalnızca havuç ve lahana için ölçüldü. Sarımsağın tadının amniyon
//     sıvısına geçtiği gösterildi. Diğer yiyecekler için tepki ölçülmedi; ekrandaki tepki tat
//     ailesine (tatlı / acı-ekşi / sade) göre bizim eşleştirmemizdir ve ekranda böyle yazar.
// Fotoğraflar public/anne/gorsel/yemek-<id>.jpg dosyalarıdır (kaynakları aynı klasörde).
//
// DURUM: Dr. Eray'ın onayı bekleniyor (liste, tat eşleştirmesi ve kafein notu).

export type Taste = "tatli" | "aci" | "sade"

export const FOOD_GROUPS = [
  { id: "meyve", label: "Meyve" },
  { id: "sebze", label: "Sebze" },
  { id: "yemek", label: "Yemek" },
  { id: "tatli", label: "Tatlı" },
  { id: "atistirmalik", label: "Atıştırmalık" },
  { id: "icecek", label: "İçecek" },
] as const

export type FoodGroup = (typeof FOOD_GROUPS)[number]["id"]

export type Food = {
  id: string
  label: string
  group: FoodGroup
  taste: Taste
  /** "olculdu": bebeğin yüz ifadesi bu yiyecekle ölçüldü. "ulasir": tadının bebeğe ulaştığı gösterildi. */
  evidence?: "olculdu" | "ulasir"
  /** Kafeinli içecek: seçilince günlük sınır notu görünür. */
  caffeine?: boolean
}

export const FOODS: readonly Food[] = [
  { id: "erik", label: "Yeşil erik", group: "meyve", taste: "aci" },
  { id: "karpuz", label: "Karpuz", group: "meyve", taste: "tatli" },
  { id: "limon", label: "Limon", group: "meyve", taste: "aci" },
  { id: "cilek", label: "Çilek", group: "meyve", taste: "tatli" },
  { id: "elma", label: "Elma", group: "meyve", taste: "tatli" },
  { id: "seftali", label: "Şeftali", group: "meyve", taste: "tatli" },
  { id: "ayva", label: "Ayva", group: "meyve", taste: "aci" },
  { id: "nar", label: "Nar", group: "meyve", taste: "tatli" },
  { id: "portakal", label: "Portakal", group: "meyve", taste: "tatli" },
  { id: "uzum", label: "Üzüm", group: "meyve", taste: "tatli" },
  { id: "incir", label: "İncir", group: "meyve", taste: "tatli" },
  { id: "muz", label: "Muz", group: "meyve", taste: "tatli" },
  { id: "kiraz", label: "Kiraz", group: "meyve", taste: "tatli" },
  { id: "hurma", label: "Hurma", group: "meyve", taste: "tatli" },
  { id: "greyfurt", label: "Greyfurt", group: "meyve", taste: "aci" },

  { id: "havuc", label: "Havuç", group: "sebze", taste: "tatli", evidence: "olculdu" },
  { id: "lahana", label: "Kara lahana", group: "sebze", taste: "aci", evidence: "olculdu" },
  { id: "sarimsak", label: "Sarımsak", group: "sebze", taste: "aci", evidence: "ulasir" },
  { id: "domates", label: "Domates", group: "sebze", taste: "sade" },
  { id: "salatalik", label: "Salatalık", group: "sebze", taste: "sade" },
  { id: "biber", label: "Acı biber", group: "sebze", taste: "aci" },
  { id: "ispanak", label: "Ispanak", group: "sebze", taste: "aci" },
  { id: "brokoli", label: "Brokoli", group: "sebze", taste: "aci" },

  { id: "corba", label: "Çorba", group: "yemek", taste: "sade" },
  { id: "kebap", label: "Kebap", group: "yemek", taste: "sade" },
  { id: "balik", label: "Balık", group: "yemek", taste: "sade" },
  { id: "makarna", label: "Makarna", group: "yemek", taste: "sade" },
  { id: "sarma", label: "Yaprak sarma", group: "yemek", taste: "aci" },
  { id: "pide", label: "Kıymalı pide", group: "yemek", taste: "sade" },
  { id: "yogurt", label: "Yoğurt", group: "yemek", taste: "sade" },
  { id: "peynir", label: "Beyaz peynir", group: "yemek", taste: "sade" },
  { id: "baharat", label: "Baharatlı yemek", group: "yemek", taste: "aci" },

  { id: "cikolata", label: "Çikolata", group: "tatli", taste: "tatli" },
  { id: "dondurma", label: "Dondurma", group: "tatli", taste: "tatli" },
  { id: "baklava", label: "Baklava", group: "tatli", taste: "tatli" },
  { id: "kek", label: "Pasta", group: "tatli", taste: "tatli" },
  { id: "bal", label: "Bal", group: "tatli", taste: "tatli" },

  { id: "tursu", label: "Turşu", group: "atistirmalik", taste: "aci" },
  { id: "zeytin", label: "Zeytin", group: "atistirmalik", taste: "sade" },
  { id: "ceviz", label: "Ceviz", group: "atistirmalik", taste: "sade" },
  { id: "cips", label: "Cips", group: "atistirmalik", taste: "sade" },

  { id: "su", label: "Su", group: "icecek", taste: "sade" },
  { id: "sut", label: "Süt", group: "icecek", taste: "sade" },
  { id: "ayran", label: "Ayran", group: "icecek", taste: "sade" },
  { id: "limonata", label: "Limonata", group: "icecek", taste: "tatli" },
  { id: "meyvesuyu", label: "Portakal suyu", group: "icecek", taste: "tatli" },
  { id: "cay", label: "Çay", group: "icecek", taste: "aci", caffeine: true },
  { id: "kahve", label: "Türk kahvesi", group: "icecek", taste: "aci", caffeine: true },
  { id: "kola", label: "Kola", group: "icecek", taste: "tatli", caffeine: true },
]

/** Bir grubun yiyecekleri; sıra her gün başka bir yiyecekten başlar. */
export function foodsOfDay(group: FoodGroup, day: number): Food[] {
  const list = FOODS.filter((food) => food.group === group)
  const start = ((day % list.length) + list.length) % list.length
  return [...list.slice(start), ...list.slice(0, start)]
}

/** Ekran her gün başka bir grupla açılır. */
export function groupOfDay(day: number): FoodGroup {
  return FOOD_GROUPS[((day % FOOD_GROUPS.length) + FOOD_GROUPS.length) % FOOD_GROUPS.length].id
}

const FAMILY: Record<Taste, string> = {
  tatli: "tatlı",
  aci: "acı, ekşi ya da keskin",
  sade: "sade",
}

/** Seçilen yiyecek için "Bilim ne diyor?" metni ve dayandığı kaynak. */
export function foodScience(food: Food | null): { text: string; source: SourceKey } {
  if (!food) {
    return {
      text: "Yediklerinin tadı bebeğini saran sıvıya geçer; bebeğin onu yutarken tadar. Bir yiyecek seç, ne bilindiğini gör.",
      source: "tatDerleme",
    }
  }
  if (food.evidence === "olculdu") {
    return {
      text: "Bu yiyecek araştırmada denendi. 100 gebeyle yapılan çalışmada, anne havuç aldıktan sonra bebekler ultrasonda daha çok gülen yüz, kara lahana aldıktan sonra daha çok ağlayan yüz ifadesi yaptı. Araştırmacılar bunun sevinç ya da üzüntü diye yorumlanmaması gerektiğini söylüyor.",
      source: "tatDurham",
    }
  }
  const guess = `Ekrandaki tepki, ${FAMILY[food.taste]} tatlar için bilinenlere dayalı bizim tahminimizdir.`
  if (food.evidence === "ulasir") {
    return {
      text: `Araştırmalar bu tadın bebeği saran sıvıya geçtiğini gösteriyor; bebeğin yüz ifadesi ise bu yiyecekle ölçülmedi. ${guess}`,
      source: "tatDerleme",
    }
  }
  return {
    text: `Bu yiyecek için bebeğin tepkisi ölçülmedi; yüz ifadesi yalnızca havuç ve kara lahanayla incelendi. ${guess}`,
    source: "tatDerleme",
  }
}

/** Kafeinli içecekler seçilince gösterilen not. */
export const CAFFEINE_NOTE = "Kafein notu: gebelikte günde 200 miligrama kadar kafein güvenli kabul edilir; kahve, çay ve kola bu sınıra sayılır."
