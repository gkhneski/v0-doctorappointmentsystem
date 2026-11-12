import type { Metadata, Viewport } from "next"
import { Urbanist } from "next/font/google"
import type { ReactNode } from "react"
import "./anne.css"

const urbanist = Urbanist({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-anne",
  display: "swap",
})

// Hasta uygulamasının kendi kimliği. Sitenin genel başlık kalıbı (doktor adı) burada kullanılmaz:
// uygulama ve üretilen içerik doktor adı taşımaz (ana plan, 5.1).
export const metadata: Metadata = {
  title: { absolute: "NeoBreed" },
  description: "Bebeğin her hafta nasıl büyüyor, sırada ne var: hepsi burada.",
  applicationName: "NeoBreed",
  manifest: "/anne.webmanifest",
  // Hukuki metinler hazır olana kadar arama motorlarına kapalı.
  robots: { index: false, follow: false },
  alternates: { canonical: "/anne" },
  openGraph: { title: "NeoBreed", description: "Bebeğin her hafta nasıl büyüyor, sırada ne var: hepsi burada.", images: [] },
  twitter: { card: "summary", title: "NeoBreed", images: [] },
  icons: { icon: "/anne-icon.svg", apple: "/anne-icon-180.png" },
  appleWebApp: { capable: true, title: "NeoBreed", statusBarStyle: "default" },
}

export const viewport: Viewport = {
  themeColor: "#f4f5f5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function AnneLayout({ children }: { children: ReactNode }) {
  return <div className={`anne ${urbanist.variable}`}>{children}</div>
}
