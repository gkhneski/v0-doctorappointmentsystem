import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"
import type { ImageSlot } from "@/lib/anne/images"
import { themeFor } from "@/lib/anne/look-service"
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
      {title ? <h2>{title}</h2> : <span className="nb-brand">NEOBREED</span>}
      {children}
    </header>
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
        <Link key={tab.key} href={tab.href} aria-current={tab.key === current ? "page" : undefined}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={tab.path} />
          </svg>
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
