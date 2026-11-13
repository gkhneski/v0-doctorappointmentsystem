// Renk teması ve "Süsle": annenin bebeğin yüzüne taktığı aksesuarlar.
// Aksesuarlar düz çizimlerdir (SVG); resmin kendisi değişmez, üstüne bir katman olarak konur.
// Bu dosya yalnızca veri ve saf işlevler içerir; tarayıcıda da sunucuda da kullanılır.

export const THEMES = ["kiz", "erkek", "sade"] as const
export type Theme = (typeof THEMES)[number]

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value)
}

/** Annenin seçimi varsa o; yoksa bebek yüzünde seçilen cinsiyet; o da yoksa sade. */
export function resolveTheme(choice: unknown, gender: unknown): Theme {
  if (isTheme(choice)) return choice
  if (gender === "female") return "kiz"
  if (gender === "male") return "erkek"
  return "sade"
}

export type Accessory = {
  id: string
  label: string
  /** Hangi temada öne alınır. Bütün aksesuarlar her bebeğe açıktır; bu yalnızca sırayı belirler. */
  lean: "kiz" | "erkek" | "ortak"
  /** Çizimin ölçüsü (viewBox genişliği ve yüksekliği). */
  w: number
  h: number
  svg: string
  /** İlk konduğu yer (resme göre 0–1) ve genişliği (resim genişliğine oran). */
  place: { x: number; y: number; size: number }
}

const BOW =
  '<path d="M50 30C35 8 8 6 6 30c2 24 29 22 44 0z" fill="#f58fb0"/><path d="M50 30C65 8 92 6 94 30c-2 24-29 22-44 0z" fill="#f58fb0"/><rect x="41" y="18" width="18" height="24" rx="8" fill="#e06a94"/>'

export const ACCESSORIES: readonly Accessory[] = [
  { id: "toka", label: "Toka", lean: "kiz", w: 100, h: 60, svg: BOW, place: { x: 0.66, y: 0.16, size: 0.24 } },
  {
    id: "sapka",
    label: "Şapka",
    lean: "erkek",
    w: 100,
    h: 62,
    svg: '<path d="M14 48C14 20 32 8 52 8c20 0 36 14 36 40z" fill="#7db7e8"/><path d="M10 46h84c6 0 6 11-1 11H58c-18 0-36-4-48-11z" fill="#4f8fc7"/><circle cx="52" cy="8" r="4.5" fill="#4f8fc7"/>',
    place: { x: 0.5, y: 0.13, size: 0.56 },
  },
  {
    id: "emzik",
    label: "Emzik",
    lean: "ortak",
    w: 100,
    h: 68,
    svg: '<circle cx="50" cy="46" r="15" fill="none" stroke="#f4c542" stroke-width="7"/><path d="M14 26c0-16 22-18 36-12 14-6 36-4 36 12S64 44 50 38c-14 6-36 4-36-12z" fill="#8fd3c8"/><circle cx="50" cy="26" r="8" fill="#5fb8ab"/>',
    place: { x: 0.5, y: 0.72, size: 0.24 },
  },
  {
    id: "tac",
    label: "Taç",
    lean: "kiz",
    w: 100,
    h: 70,
    svg: '<path d="M10 58L6 18l24 20L50 8l20 30 24-20-4 40z" fill="#f4c542"/><rect x="10" y="54" width="80" height="12" rx="4" fill="#e0a92e"/><circle cx="30" cy="60" r="3.5" fill="#f0597f"/><circle cx="50" cy="60" r="3.5" fill="#7db7e8"/><circle cx="70" cy="60" r="3.5" fill="#f0597f"/>',
    place: { x: 0.5, y: 0.11, size: 0.4 },
  },
  {
    id: "cicek",
    label: "Çiçek",
    lean: "kiz",
    w: 100,
    h: 100,
    svg: '<g fill="#f9a8c4"><circle cx="50" cy="26" r="20"/><circle cx="72.8" cy="42.6" r="20"/><circle cx="64.1" cy="69.4" r="20"/><circle cx="35.9" cy="69.4" r="20"/><circle cx="27.2" cy="42.6" r="20"/></g><circle cx="50" cy="50" r="14" fill="#f4c542"/>',
    place: { x: 0.68, y: 0.17, size: 0.18 },
  },
  {
    id: "sacbandi",
    label: "Saç bandı",
    lean: "kiz",
    w: 100,
    h: 58,
    svg: `<path d="M5 54C10 20 90 20 95 54" fill="none" stroke="#f9a8c4" stroke-width="9" stroke-linecap="round"/><g transform="translate(32 4) scale(0.36)">${BOW}</g>`,
    place: { x: 0.5, y: 0.15, size: 0.6 },
  },
  {
    id: "kalpgozluk",
    label: "Kalp gözlük",
    lean: "kiz",
    w: 100,
    h: 44,
    svg: '<path d="M44 16q6-5 12 0" fill="none" stroke="#c2385c" stroke-width="5" stroke-linecap="round"/><path d="M25 40C8 28 4 18 8 11c4-7 13-7 17 1 4-8 13-8 17-1 4 7 0 17-17 29z" fill="#f0597f"/><path transform="translate(50 0)" d="M25 40C8 28 4 18 8 11c4-7 13-7 17 1 4-8 13-8 17-1 4 7 0 17-17 29z" fill="#f0597f"/>',
    place: { x: 0.5, y: 0.44, size: 0.5 },
  },
  {
    id: "kelebek",
    label: "Kelebek",
    lean: "kiz",
    w: 100,
    h: 80,
    svg: '<ellipse cx="28" cy="26" rx="24" ry="20" fill="#b79df0"/><ellipse cx="72" cy="26" rx="24" ry="20" fill="#b79df0"/><ellipse cx="32" cy="58" rx="18" ry="15" fill="#f9a8c4"/><ellipse cx="68" cy="58" rx="18" ry="15" fill="#f9a8c4"/><rect x="46" y="14" width="8" height="56" rx="4" fill="#4b3a6b"/>',
    place: { x: 0.7, y: 0.2, size: 0.17 },
  },
  {
    id: "bere",
    label: "Bere",
    lean: "erkek",
    w: 100,
    h: 80,
    svg: '<circle cx="50" cy="12" r="11" fill="#f2f2f2"/><path d="M14 62c0-32 16-44 36-44s36 12 36 44z" fill="#6fa8dc"/><rect x="8" y="56" width="84" height="20" rx="10" fill="#3d7ab8"/><path d="M28 60v12M42 60v12M58 60v12M72 60v12" stroke="#6fa8dc" stroke-width="3" stroke-linecap="round"/>',
    place: { x: 0.5, y: 0.12, size: 0.56 },
  },
  {
    id: "papyon",
    label: "Papyon",
    lean: "erkek",
    w: 100,
    h: 50,
    svg: '<path d="M50 25L9 5C5 3 2 6 2 11v28c0 5 3 8 7 6z" fill="#2f5fa8"/><path d="M50 25L91 5c4-2 7 1 7 6v28c0 5-3 8-7 6z" fill="#2f5fa8"/><rect x="41" y="14" width="18" height="22" rx="7" fill="#1e3f75"/>',
    place: { x: 0.5, y: 0.9, size: 0.28 },
  },
  {
    id: "gozluk",
    label: "Güneş gözlüğü",
    lean: "erkek",
    w: 100,
    h: 40,
    svg: '<path d="M42 16q8-7 16 0" fill="none" stroke="#1f1f1f" stroke-width="5" stroke-linecap="round"/><rect x="3" y="6" width="40" height="28" rx="12" fill="#1f1f1f"/><rect x="57" y="6" width="40" height="28" rx="12" fill="#1f1f1f"/><path d="M12 14l8-3M66 14l8-3" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>',
    place: { x: 0.5, y: 0.44, size: 0.5 },
  },
  {
    id: "biyik",
    label: "Bıyık",
    lean: "erkek",
    w: 100,
    h: 36,
    svg: '<path d="M50 14C42 2 22 4 14 16c-4 6-10 6-12 0 0 14 14 20 28 14 10-4 16-8 20-10 4 2 10 6 20 10 14 6 28 0 28-14-2 6-8 6-12 0C78 4 58 2 50 14z" fill="#3a2a22"/>',
    place: { x: 0.5, y: 0.62, size: 0.26 },
  },
  {
    id: "yildiz",
    label: "Yıldız",
    lean: "ortak",
    w: 100,
    h: 96,
    svg: '<path d="M50 4l13.5 29.5L96 37 72 59l6.5 32L50 75 21.500 91 28 59 4 37l32.500-3.500z" fill="#f4c542" stroke="#f4c542" stroke-width="6" stroke-linejoin="round"/>',
    place: { x: 0.3, y: 0.18, size: 0.16 },
  },
  {
    id: "parti",
    label: "Parti şapkası",
    lean: "ortak",
    w: 80,
    h: 100,
    svg: '<path d="M40 12l32 80H8z" fill="#b79df0"/><path d="M30 37l26 14M22 57l42 22" stroke="#f4c542" stroke-width="6" stroke-linecap="round"/><rect x="4" y="86" width="72" height="12" rx="6" fill="#f9a8c4"/><circle cx="40" cy="11" r="10" fill="#f9a8c4"/>',
    place: { x: 0.5, y: 0.1, size: 0.3 },
  },
  {
    id: "kedi",
    label: "Kedi kulakları",
    lean: "ortak",
    w: 100,
    h: 50,
    svg: '<path d="M6 48L13 6c1-4 4-4 7-1l25 29z" fill="#3a2a22"/><path d="M94 48L87 6c-1-4-4-4-7-1L55 34z" fill="#3a2a22"/><path d="M15 38l4-20 13 15z" fill="#f9a8c4"/><path d="M85 38l-4-20-13 15z" fill="#f9a8c4"/>',
    place: { x: 0.5, y: 0.1, size: 0.56 },
  },
]

/** Hediye beklemeden, ilk günden açık olan aksesuarlar. */
export const STARTERS: readonly string[] = ["toka", "sapka", "emzik"]

const GIFT_ORDER: Record<Theme, readonly string[]> = {
  kiz: ["tac", "cicek", "sacbandi", "kalpgozluk", "kelebek", "kedi", "yildiz", "parti", "gozluk", "biyik", "bere", "papyon"],
  erkek: ["bere", "papyon", "gozluk", "biyik", "yildiz", "parti", "kedi", "tac", "kelebek", "kalpgozluk", "cicek", "sacbandi"],
  sade: ["yildiz", "parti", "kedi", "tac", "bere", "gozluk", "cicek", "papyon", "kelebek", "biyik", "kalpgozluk", "sacbandi"],
}

export function accessoryOf(id: string): Accessory | undefined {
  return ACCESSORIES.find((item) => item.id === id)
}

/** Hediye olarak sıradaki aksesuar; hepsi açıldıysa null. */
export function nextGift(theme: Theme, unlocked: readonly string[]): string | null {
  return GIFT_ORDER[theme].find((id) => !unlocked.includes(id)) ?? null
}

/** Şeritteki sıra: temaya yakın olanlar başta. Yalnızca açık olanlar döner. */
export function trayOrder(theme: Theme, unlocked: readonly string[]): Accessory[] {
  const rank = (item: Accessory) => (theme !== "sade" && item.lean === theme ? 0 : item.lean === "ortak" || theme === "sade" ? 1 : 2)
  return ACCESSORIES.filter((item) => unlocked.includes(item.id))
    .map((item, index) => ({ item, index }))
    .sort((a, b) => rank(a.item) - rank(b.item) || a.index - b.index)
    .map((entry) => entry.item)
}

/** Yüze takılmış bir aksesuar. x, y: merkezin resimdeki yeri (0–1). size: genişliğin resim genişliğine oranı. */
export type LookItem = { item: string; x: number; y: number; size: number; rot: number }

export const MAX_LOOK_ITEMS = 8
export const LOOK_LIMITS = { xMin: 0.1, xMax: 0.9, yMin: 0.03, yMax: 0.97, sizeMin: 0.08, sizeMax: 0.95 } as const

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const round = (value: number) => Math.round(value * 1000) / 1000

export function clampLookItem(item: LookItem): LookItem {
  let rot = item.rot % 360
  if (rot > 180) rot -= 360
  if (rot < -180) rot += 360
  return {
    item: item.item,
    x: round(clamp(item.x, LOOK_LIMITS.xMin, LOOK_LIMITS.xMax)),
    y: round(clamp(item.y, LOOK_LIMITS.yMin, LOOK_LIMITS.yMax)),
    size: round(clamp(item.size, LOOK_LIMITS.sizeMin, LOOK_LIMITS.sizeMax)),
    rot: Math.round(rot),
  }
}

/**
 * Tarayıcıdan ya da veritabanından gelen görünümü temizler: yalnızca açık aksesuarlar,
 * her biri en çok bir kez, sayılar sınırların içinde. Biçim bozuksa null.
 */
export function sanitizeLook(input: unknown, unlocked: readonly string[]): LookItem[] | null {
  if (!Array.isArray(input) || input.length > MAX_LOOK_ITEMS * 4) return null
  const result: LookItem[] = []
  for (const raw of input) {
    if (!raw || typeof raw !== "object") return null
    const { item, x, y, size, rot } = raw as Record<string, unknown>
    if (typeof item !== "string" || ![x, y, size, rot].every((n) => typeof n === "number" && Number.isFinite(n))) return null
    if (!unlocked.includes(item) || !accessoryOf(item) || result.some((r) => r.item === item)) continue
    result.push(clampLookItem({ item, x: x as number, y: y as number, size: size as number, rot: rot as number }))
    if (result.length === MAX_LOOK_ITEMS) break
  }
  return result
}

/** Aksesuarın ilk konduğu hali. */
export function placed(id: string): LookItem | null {
  const accessory = accessoryOf(id)
  return accessory ? { item: id, ...accessory.place, rot: 0 } : null
}

/** Aksesuarı tek başına çizilebilir bir SVG belgesi olarak verir (paylaşım resmi için). */
export function accessorySvg(accessory: Accessory, width: number): string {
  const height = Math.round((width * accessory.h) / accessory.w)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${accessory.w} ${accessory.h}">${accessory.svg}</svg>`
}
