// Uygulamadaki görsel yuvaları. Görsel dosyası public/anne/gorsel altına konur ve yolu
// buraya yazılır; yolu olmayan yuva ekranda kesikli çerçeve olarak görünür.
// Dosyalar arka planı şeffaf PNG olmalıdır.

export type ImageSlot = {
  /** Yuvada ne olduğu: görsel yokken ekranda, varken ekran okuyucuda kullanılır. */
  label: string
  /** public altındaki yol; görsel henüz yoksa null. */
  src: string | null
}

export const IMAGES = {
  welcomeMother: { label: "Karnını tutan anne görseli", src: null },
  introMother: { label: "Koltukta oturan hamile anne görseli", src: null },
  baby: { label: "Bebek görseli", src: null },
} satisfies Record<string, ImageSlot>

export type ImageKey = keyof typeof IMAGES

/** Haftaya özel bebek görselleri eklendiğinde buraya yazılır: { 24: "/anne/gorsel/bebek-24.png" } */
export const BABY_BY_WEEK: Record<number, string> = {}

export function babyImage(week: number): ImageSlot {
  return { label: IMAGES.baby.label, src: BABY_BY_WEEK[week] ?? IMAGES.baby.src }
}
