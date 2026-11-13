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
  // Oyunlarda kullanılan hakemli araştırmalar (13.11.2026'da basın özetleri üzerinden okundu;
  // künyeler doğrulanmalı ve Dr. Eray onaylamalıdır).
  rahimdeSes: {
    id: "spence-freeman-1996",
    citation:
      "Spence ve Freeman, “Newborn infants prefer the maternal low-pass filtered voice, but not the maternal whispered voice”, Infant Behavior and Development, 1996",
    url: "https://doi.org/10.1016/S0163-6383(96)90019-3",
  },
  tatDurham: {
    id: "ustun-2022",
    citation: "Ustun ve ark., “Flavor Sensing in Utero and Emerging Discriminative Behaviors in the Human Fetus”, Psychological Science, 2022",
    url: "https://doi.org/10.1177/09567976221105460",
  },
  mideYanmasi: {
    id: "costigan-2006",
    citation: "Costigan, Sipsma ve DiPietro, “Pregnancy Folklore Revisited: The Case of Heartburn and Hair”, Birth, 2006",
    url: "https://doi.org/10.1111/j.1523-536X.2006.00128.x",
  },
} as const satisfies Record<string, Source>

export type SourceKey = keyof typeof SOURCES
