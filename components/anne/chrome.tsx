import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"
import type { ImageSlot } from "@/lib/anne/images"
import { themeFor } from "@/lib/anne/theme-service"
import { appDb, getAppUser } from "@/lib/anne/server"

// Ekranların ortak parçaları: çerçeve, arkadaki şekiller, görsel yuvası, alt gezinme.

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]

/** "2027-05-27" -> "27 Mayıs 2027" */
export function formatDateTr(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

/**
 * Her ekranın çerçevesi. Renk temasını da burada belirler: kız bebek pembe, erkek bebek mavi,
 * bilinmiyorsa sade (anne Hesap ekranından değiştirebilir). Giriş yapılmamışsa sade kalır.
 */
export async function Screen({ children }: { children: ReactNode }) {
  const user = await getAppUser().catch(() => null)
  const theme = user ? await themeFor(appDb(), user) : "sade"
  return (
    <div className="nb-screen" data-tema={theme}>
      {children}
    </div>
  )
}

/** Arkadaki düz renkli şekil. Yeri ve boyutu ekrandan ekrana değişir. */
export function Blob({ tone, style }: { tone?: "lilac" | "coral"; style: CSSProperties }) {
  return <div className="nb-blob" data-tone={tone} style={style} aria-hidden="true" />
}

/** Görsel varsa görseli, yoksa içinde ne geleceği yazan kesikli çerçeveyi gösterir. */
export function Slot({
  image,
  width,
  height,
  round,
  style,
}: {
  image: ImageSlot
  width: number
  height: number
  round?: boolean
  style?: CSSProperties
}) {
  if (image.src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className="nb-image" src={image.src} alt="" width={width} height={height} style={{ width, height, ...style }} />
    )
  }
  return (
    <div className="nb-slot" data-round={round ? "" : undefined} style={{ width, height, ...style }}>
      {image.label}
    </div>
  )
}

export function TopBar({ title, children }: { title?: string; children?: ReactNode }) {
  return (
    <header className="nb-top">
      {title ? <h2>{title}</h2> : <span className="nb-brand">NeoBreed</span>}
      {children}
    </header>
  )
}

/** Çizgi simgeler (24×24). Yeni simge eklemek için yolunu buraya yazmak yeterlidir. */
export const ICONS = {
  back: "M15 5l-7 7 7 7",
  close: "M6 6l12 12M18 6L6 18",
  mic: "M9 6a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0zM5 11a7 7 0 0 0 14 0M12 18v3",
  question: "M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.500 1.200-1.500 2.400M12 18h.01",
  taste: "M14 8L5 20l11-7a4 4 0 0 0-2-5zM15 7l2-4M17 9l4-1",
  kick: "M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0",
  heart: "M12 20s-7-4.400-7-10a4 4 0 0 1 7-2.500A4 4 0 0 1 19 10c0 5.600-7 10-7 10z",
  calendar: "M7 5h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3zM4 10h16M9 3v4M15 3v4",
  upload: "M12 15V4M7 8l5-4 5 4M5 13v6h14v-6",
  album: "M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM4 16l5-5 4 4 3-3 4 4",
  letters: "M4 18l4-11 4 11M5.500 14h5M14 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0M20 9v6",
  user: "M8 8a4 4 0 1 0 8 0 4 4 0 0 0-8 0M4 20c1-4 4-6 8-6s7 2 8 6",
  next: "M9 5l7 7-7 7",
  play: "M8 5l11 7-11 7z",
} as const

export function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg className="nb-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  )
}

const TABS = [
  { key: "bugun", href: "/anne/ana", label: "Bugün", path: "M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" },
  { key: "bebegim", href: "/anne/bebegim", label: "Bebeğim", path: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" },
  { key: "yolculuk", href: "/anne/yolculuk", label: "Yolculuk", path: "M6 21V4h11l-2 4 2 4H6" },
  { key: "oyun", href: "/anne/oyun", label: "Oyun", path: "M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8z" },
  { key: "sor", href: "/anne/sor", label: "Sor", path: "M4 5h16v11H9l-5 4z" },
] as const

export type TabKey = (typeof TABS)[number]["key"]

export function Tabs({ current }: { current: TabKey }) {
  return (
    <nav className="nb-tabs" aria-label="Ana bölümler">
      {TABS.map((tab) => (
        <Link key={tab.key} href={tab.href} aria-label={tab.label} aria-current={tab.key === current ? "page" : undefined}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={tab.path} />
          </svg>
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}
