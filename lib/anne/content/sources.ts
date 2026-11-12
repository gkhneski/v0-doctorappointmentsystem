// Uygulamadaki sağlık içeriğinin dayandığı resmî kaynaklar.
//
// Metinler bu kaynaklardan aynen alınmaz; kaynaktaki bilgi kendi cümlelerimizle yazılır ve
// her içerik hangi kaynağa dayandığını gösterir. Kaynakların künyesindeki kural:
// "Kaynak gösterilmeksizin alıntı yapılamaz. Kısmen dahi olsa alınamaz, çoğaltılamaz, yayımlanamaz."
// Atıf biçimi de künyede tarif edildiği gibidir (başlık, kurum, yayın no, yer ve tarih).
//
// Kaynaklar 12.11.2026'da okundu. Bakanlık yeni baskı yayımlarsa içerik yeniden gözden geçirilmelidir.

export type Source = {
  id: string
  /** Ekranda gösterilen atıf. */
  citation: string
  url: string
}

export const SOURCES = {
  gebeOkulu: {
    id: "gebe-okulu-2025",
    citation:
      "“Gebe Okulu Eğitim Kitabı”, T.C. Sağlık Bakanlığı Halk Sağlığı Genel Müdürlüğü, Yayın No: 1368, Ankara, 2025",
    url: "https://hsgm.saglik.gov.tr/depo/birimler/kadin-ve-ureme-sagligi-db/Rehberler/GEBE_OKULU_EGITIM_KITABI.pdf",
  },
  dogumOncesi: {
    id: "dob-2026",
    citation:
      "“Doğum Öncesi Bakım Yönetim Rehberi”, T.C. Sağlık Bakanlığı Halk Sağlığı Genel Müdürlüğü, Yayın No: 1402, Ankara, 2026",
    url: "https://hsgm.saglik.gov.tr/depo/birimler/kadin-ve-ureme-sagligi-db/Rehberler/DOB_2026.pdf",
  },
  nutrisyonelDestek: {
    id: "nutrisyonel-destek",
    citation: "“Gebelere Nutrisyonel Destek Programı”, T.C. Sağlık Bakanlığı Halk Sağlığı Genel Müdürlüğü",
    url: "https://hsgm.saglik.gov.tr/tr/programlar-2/gebelere-nutrisyonel-destek-programi.html",
  },
} as const satisfies Record<string, Source>

export type SourceKey = keyof typeof SOURCES
