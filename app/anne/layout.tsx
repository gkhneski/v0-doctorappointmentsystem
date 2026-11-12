import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import "./anne.css"

// Hasta uygulamasının kendi kimliği. Sitenin genel başlık kalıbı (doktor adı) burada kullanılmaz:
// uygulama ve üretilen içerik doktor adı taşımaz (ana plan, 5.1).
export const metadata: Metadata = {
  title: { absolute: "NeoBreed" },
  description: "Gebelik haftanızı ve tahmini doğum tarihinizi takip edin.",
  applicationName: "NeoBreed",
  manifest: "/anne.webmanifest",
  // Hukuki metinler hazır olana kadar arama motorlarına kapalı.
  robots: { index: false, follow: false },
  alternates: { canonical: "/anne" },
  openGraph: { title: "NeoBreed", description: "Gebelik haftanızı ve tahmini doğum tarihinizi takip edin.", images: [] },
  twitter: { card: "summary", title: "NeoBreed", images: [] },
  icons: { icon: "/anne-icon.svg", apple: "/anne-icon-180.png" },
  appleWebApp: { capable: true, title: "NeoBreed", statusBarStyle: "default" },
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function AnneLayout({ children }: { children: ReactNode }) {
  return (
    <div className="anne">
      <div className="anne-page">{children}</div>
    </div>
  )
}
