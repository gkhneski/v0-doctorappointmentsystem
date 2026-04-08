import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import AiStickyWidget from "@/components/ai-sticky-widget"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

// Sabit domain — env var yerine hardcode kullan (hydration mismatch önlemek için)
const SITE_URL = "https://www.dreraycaliskan.com"

export const metadata: Metadata = {
  title: {
    default: "Prof. Dr. Eray Çalışkan | Kocaeli Tüp Bebek, Gebelik Takibi, Aşılama Uzmanı",
    template: "%s | Prof. Dr. Eray Çalışkan",
  },
  description: "Prof. Dr. Eray Çalışkan — 2000+ başarılı tüp bebek tedavisi, 1000+ bilimsel yayın. Kocaeli'nin en deneyimli tüp bebek, gebelik takibi, ayrıntılı fetal ultrason ve aşılama uzmanı. Perinatoloji Yan Dal Uzmanı. Türkiye ve Bulgaristan'dan hasta kabul edilmektedir.",
  keywords: [
    // Türkiye - Kocaeli odaklı
    "tüp bebek kocaeli",
    "kocaeli tüp bebek",
    "tüp bebek doktoru kocaeli",
    "en iyi tüp bebek doktoru kocaeli",
    "gebelik takibi kocaeli",
    "ayrıntılı ultrason kocaeli",
    "fetal ultrason kocaeli",
    "aşılama kocaeli",
    "iui kocaeli",
    "gebelik istemi kocaeli",
    "infertilite kocaeli",
    "kısırlık tedavisi kocaeli",
    "riskli gebelik kocaeli",
    "perinatoloji kocaeli",
    "kadın doğum uzmanı kocaeli",
    "izmit tüp bebek",
    "gebze tüp bebek",
    // Türkiye - Ulusal
    "tüp bebek uzmanı türkiye",
    "en iyi tüp bebek doktoru türkiye",
    "2000 tüp bebek başarısı",
    "başarılı tüp bebek tedavisi",
    "prof dr tüp bebek",
    "perinatoloji uzmanı türkiye",
    // Kişisel
    "prof dr eray çalışkan",
    "eray çalışkan tüp bebek",
    "eray çalışkan randevu",
    "eray çalışkan kocaeli",
    // Bulgaristan - Bulgarca
    "ин витро оплождане турция",
    "ин витро турция",
    "ин витро кочаели",
    "проф д-р ерай чалъшкан",
    "ин витро доктор турция",
    "лечение на безплодие турция",
    "бременност проследяване турция",
    "фетална ехография турция",
    "ин витро оплождане проф",
    // Bulgaristan - Latin harfli arama
    "in vitro oplozhdane turtsiya",
    "IVF Turkey Bulgarian patients",
    "IVF specialist Turkey Bulgaria",
    "Kocaeli IVF doctor",
    // İngilizce - yabancı hasta
    "IVF specialist Turkey",
    "IVF doctor Kocaeli Turkey",
    "IVF treatment Turkey professor",
    "perinatology specialist Turkey",
    "2000 successful IVF Turkey",
    "high risk pregnancy specialist Turkey",
  ],
  authors: [{ name: "Prof. Dr. Eray Çalışkan" }],
  creator: "Prof. Dr. Eray Çalışkan",
  publisher: "Prof. Dr. Eray Çalışkan",
  generator: "v0.app",
  applicationName: "Prof. Dr. Eray Çalışkan Randevu Sistemi",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
    languages: {
      "tr-TR": "/",
      "bg-BG": "/bg",
      "en-US": "/en",
    },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    alternateLocale: ["bg_BG", "en_US"],
    url: "/",
    title: "Prof. Dr. Eray Çalışkan | 2000+ Başarılı Tüp Bebek | Kocaeli",
    description: "Prof. Dr. Eray Çalışkan — 2000+ başarılı tüp bebek tedavisi, 1000+ bilimsel yayın. Kocaeli tüp bebek, gebelik takibi, aşılama uzmanı. Türkiye ve Bulgaristan'dan hasta kabul edilmektedir.",
    siteName: "Prof. Dr. Eray Çalışkan",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Prof. Dr. Eray Çalışkan - Tüp Bebek ve Gebelik Uzmanı Kocaeli - 2000+ Başarılı Tedavi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prof. Dr. Eray Çalışkan | Kocaeli Tüp Bebek Uzmanı",
    description: "Kocaeli tüp bebek, gebelik takibi, aşılama uzmanı. Online randevu alın.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "_S0Uc_Jrp0qM-Gn5uq_UcqkDSin5zTKuexBMlfTSnGM",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

// JSON-LD Schema for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "MedicalBusiness",
      "@id": `${SITE_URL}/#medicalbusiness`,
      name: "Prof. Dr. Eray Çalışkan - Kadın Hastalıkları ve Doğum",
      alternateName: "Prof. Dr. Eray Çalışkan Tüp Bebek Merkezi",
      description: "Kocaeli'nin önde gelen tüp bebek, gebelik takibi, ayrıntılı fetal ultrason ve aşılama uzmanı.",
      url: SITE_URL,
      telephone: "+905321234567",
      email: "info@eraycaliskan.com",
      priceRange: "₺₺₺",
      currenciesAccepted: "TRY",
      paymentAccepted: "Cash, Credit Card",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Kocaeli",
        addressLocality: "Kocaeli",
        addressRegion: "Kocaeli",
        postalCode: "41000",
        addressCountry: "TR",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 40.8533,
        longitude: 29.8815,
      },
      areaServed: [
        { "@type": "City", name: "Kocaeli" },
        { "@type": "City", name: "İzmit" },
        { "@type": "City", name: "Gebze" },
        { "@type": "City", name: "Derince" },
        { "@type": "City", name: "Gölcük" },
        { "@type": "Country", name: "Turkey" },
        { "@type": "Country", name: "Bulgaria" },
      ],
      knowsLanguage: ["tr", "bg", "en"],
      medicalSpecialty: [
        "Obstetrics",
        "Gynecology", 
        "Perinatology",
        "Reproductive Medicine",
        "Infertility",
      ],
      availableService: [
        {
          "@type": "MedicalProcedure",
          name: "Tüp Bebek Tedavisi (IVF)",
          description: "Kocaeli'de tüp bebek tedavisi ve yardımcı üreme teknikleri",
        },
        {
          "@type": "MedicalProcedure", 
          name: "Aşılama (IUI)",
          description: "İntrauterin inseminasyon - aşılama tedavisi",
        },
        {
          "@type": "MedicalProcedure",
          name: "Gebelik Takibi",
          description: "Riskli ve normal gebelik takibi",
        },
        {
          "@type": "MedicalProcedure",
          name: "Ayrıntılı Fetal Ultrason",
          description: "Detaylı fetal anomali taraması ve 3D/4D ultrason",
        },
        {
          "@type": "MedicalProcedure",
          name: "Gebelik İstemi / İnfertilite Tedavisi",
          description: "Kısırlık tedavisi ve gebelik planlaması",
        },
      ],
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "09:00",
          closes: "18:00",
        },
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: "Saturday",
          opens: "09:00",
          closes: "14:00",
        },
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "150",
        bestRating: "5",
        worstRating: "1",
      },
    },
    {
      "@type": "Physician",
      "@id": `${SITE_URL}/#physician`,
      name: "Prof. Dr. Eray Çalışkan",
      honorificPrefix: "Prof. Dr.",
      givenName: "Eray",
      familyName: "Çalışkan",
      jobTitle: "Kadın Hastalıkları ve Doğum Uzmanı, Perinatoloji Yan Dal Uzmanı",
      description: "2000+ başarılı tüp bebek tedavisi ve 1000+ bilimsel yayın sahibi. Kocaeli'nin en deneyimli tüp bebek, perinatoloji ve gebelik uzmanı. Türkiye ve Bulgaristan'dan hasta kabul edilmektedir.",
      medicalSpecialty: ["Obstetrics", "Gynecology", "Perinatology", "Reproductive Medicine"],
      knowsLanguage: ["tr", "bg", "en"],
      hasCredential: [
        {
          "@type": "EducationalOccupationalCredential",
          credentialCategory: "degree",
          name: "Tıp Doktoru - Hacettepe Üniversitesi Tıp Fakültesi",
        },
        {
          "@type": "EducationalOccupationalCredential",
          credentialCategory: "certification",
          name: "Perinatoloji Yan Dal Uzmanlığı",
        },
        {
          "@type": "EducationalOccupationalCredential",
          credentialCategory: "degree",
          name: "Profesörlük Unvanı",
        },
      ],
      award: [
        "2000+ Başarılı Tüp Bebek Tedavisi",
        "1000+ Uluslararası Bilimsel Yayın",
        "Bahçeşehir Üniversitesi Tıp Fakültesi Dekan Yardımcılığı",
      ],
      worksFor: {
        "@id": `${SITE_URL}/#medicalbusiness`,
      },
      url: SITE_URL,
      sameAs: [
        // Sosyal medya linkleri eklenebilir
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Prof. Dr. Eray Çalışkan - Online Randevu",
      description: "Kocaeli tüp bebek, gebelik takibi, aşılama uzmanı online randevu sistemi",
      publisher: {
        "@id": `${SITE_URL}/#physician`,
      },
      inLanguage: "tr-TR",
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/randevu?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Kocaeli'de tüp bebek tedavisi nerede yapılır?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Prof. Dr. Eray Çalışkan, Kocaeli'de tüp bebek tedavisi konusunda uzman hekimdir. Online randevu alarak muayene olabilirsiniz.",
          },
        },
        {
          "@type": "Question",
          name: "Gebelik takibi için ne zaman doktora gidilmeli?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Gebelik testi pozitif çıktıktan sonra 6-8 hafta içinde ilk muayene için randevu alınmalıdır. Prof. Dr. Eray Çalışkan riskli gebelik takibi konusunda uzmanlaşmıştır.",
          },
        },
        {
          "@type": "Question",
          name: "Ayrıntılı fetal ultrason ne zaman yapılır?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ayrıntılı fetal ultrason (anomali taraması) genellikle 18-22. haftalarda yapılır. Prof. Dr. Eray Çalışkan detaylı fetal ultrason konusunda deneyimlidir.",
          },
        },
      ],
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <AiStickyWidget />
        <Analytics />
      </body>
    </html>
  )
}
