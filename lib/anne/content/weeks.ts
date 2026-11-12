import type { SourceKey } from "@/lib/anne/content/sources"

// Hafta hafta bebeğin gelişimi.
// Kaynak: Gebe Okulu Eğitim Kitabı (2025), "Bebeğin Anne Karnındaki Gelişimi" bölümü.
// Bilgiler kaynaktan, cümleler bizden. Kaynakta olmayan hiçbir bilgi eklenmedi; kaynaktaki
// bazı cümleler (erken doğumda yaşama şansı, düşük olasılığı, cinsiyet tahmini) bilerek alınmadı.
// Kaynak 5. haftadan 40. haftaya kadar hafta hafta yazar; 1–4. haftalar tek paragraftır,
// 41. ve 42. haftalar için metin yoktur.
//
// DURUM: Dr. Eray'ın onayı bekleniyor (yalnızca deneme kullanıcıları görüyor).

export const WEEKS_SOURCE: SourceKey = "gebeOkulu"

export type WeekContent = {
  /** Tamamlanan hafta sayısı (ekrandaki büyük sayı). */
  week: number
  text: string
  /** Kaynaktaki yaklaşık boy, okunur biçimde. */
  length?: string
  /** Kaynaktaki yaklaşık ağırlık, okunur biçimde. */
  weight?: string
}

const EARLY_TEXT =
  "Gebelik haftası son adetin ilk gününden sayılır; bu yüzden ilk iki hafta bir hazırlık dönemidir ve yumurtlama ikinci haftanın sonunda olur. Döllenme üçüncü haftada gerçekleşir. Dördüncü haftada hücre topluluğu rahim duvarına yerleşir; plasentanın ve bebeği saracak amniyon kesesinin başlangıcı oluşur."

const WEEKS: WeekContent[] = [
  {
    week: 5,
    text: "Beyni, omuriliği ve sinir sisteminin geri kalanını oluşturacak yapı olan nöral tüp bu hafta oluşur. Adet gecikmesi çoğunlukla bu dönemde fark edilir ve gebelik testi pozitif çıkar.",
  },
  {
    week: 6,
    text: "Kollara ve bacaklara dönüşecek küçük tomurcuklar belirir. Kan hücreleri şekillenir ve dolaşım başlar. Kulak, göz ve ağzı oluşturacak yapılar şekillenmeye başlar. Kalbi oluşturacak hücre kümesindeki atımlar bu haftadan itibaren saptanabilir.",
    length: "3–5 mm",
  },
  {
    week: 7,
    text: "Yumuşak kıkırdağın yerini kemik almaya başlar. Sindirim sistemi, akciğerler ve solunum yolları oluşmaya başlar. Baş, vücudun geri kalanına göre büyüktür; burun, ağız ve kulağın biçimi ile göz çukurları belirginleşir.",
    length: "yaklaşık 1 cm",
  },
  {
    week: 8,
    text: "Bütün önemli organlar ve vücut sistemleri gelişmektedir. El ve ayak parmaklarının arası henüz perdelidir. Gözler görünür hale gelir, kulaklar oluşmaya başlar. Göbek bağı gelişimini tamamlamıştır; bebeğe oksijen ve kan taşır.",
    length: "1,3–2,5 cm",
    weight: "yaklaşık 1,5 g",
  },
  {
    week: 9,
    text: "Kalp artık dört bölümlüdür ve kapakçıkları oluşmuştur. Ağız ve dil oluşur; dişlerin ve tat tomurcuklarının başlangıcı belirir. Karaciğer ve pankreas çalışmaya başlamıştır. Kaslar oluşur, vücut insan görünümüne yaklaşır; baş hâlâ boyun yarısı kadardır.",
    length: "2–3 cm",
    weight: "yaklaşık 3 g",
  },
  {
    week: 10,
    text: "Kollar, eller, ayaklar ve parmaklar tamamen oluşmuştur; parmakların arasındaki perde kalkmıştır. Tırnaklar gelişmeye başlar, dış kulak oluşur. Mide sindirime yardımcı olacak asitleri, böbrekler idrarı üretmeye başlar.",
    length: "yaklaşık 3,5 cm",
    weight: "yaklaşık 8 g",
  },
  {
    week: 11,
    text: "Bebek yumruğunu ve ağzını açıp kapatır; dizlerini, dirseklerini ve ayak bileklerini oynatır. Bu hareketler ultrasonda görülür ama sizin hissetmeniz için henüz erkendir. Kemikler sertleşmeye başlar, cilt hâlâ saydamdır. Dokunma duyusu oluşmaya başlar.",
    length: "yaklaşık 4 cm",
  },
  {
    week: 12,
    text: "Bütün organlar, uzuvlar, kemikler ve kaslar yerindedir; bundan sonra olgunlaşarak gelişirler. Dolaşım, sindirim ve boşaltım sistemleri çalışır. Bebek amniyon sıvısını yutar ve idrarını yapar. Sabah bulantıları çoğunlukla bu dönemde azalır.",
    length: "6–7,5 cm",
    weight: "14–20 g",
  },
  {
    week: 13,
    text: "Ses telleri oluşur. Başın büyüklüğü vücudun geri kalanıyla orantılı hale gelmeye başlar.",
    length: "yaklaşık 8 cm",
    weight: "yaklaşık 25 g",
  },
  {
    week: 14,
    text: "Cilt kalınlaşmaya, ince saçlar uzamaya başlar. Bebek parmaklarını ağzına götürebilir ve başını çevirebilir. Gözleri hâlâ kapalıdır. Dış genital organlar gelişimini tamamlamıştır; parmak izleri oluşmaya başlar.",
    length: "yaklaşık 8,5 cm",
    weight: "yaklaşık 60 g",
  },
  {
    week: 15,
    text: "Bağırsaklar ve kulaklar kalıcı yerlerine doğru ilerler. Bebek amniyon sıvısıyla nefes alma alıştırması yapar; akciğerleri gelişmeye başlar. Başparmağını emmek gibi daha amaçlı hareketler görülür.",
    length: "10–11 cm",
    weight: "yaklaşık 65 g",
  },
  {
    week: 16,
    text: "Gözleri kapalı olsa da bebek ışığa yüzünü çevirerek tepki verebilir.",
    length: "11–12 cm",
    weight: "80–100 g",
  },
  {
    week: 17,
    text: "Cilt hâlâ incedir ama altında yağ birikmeye başlar. Cildi, verniks adı verilen beyazımsı bir tabaka kaplar; bu tabakanın cildi amniyon sıvısından koruduğu düşünülür.",
    length: "yaklaşık 13 cm",
    weight: "yaklaşık 150 g",
  },
  {
    week: 18,
    text: "Bebeğin vücudu lanugo denen ince tüylerle kaplıdır; bu tüyler sıcak kalmasına yardım eder. Uyku ve uyanıklık döngüsü oluşabilir; yüksek sesler uyuyan bebeği uyandırabilir.",
    length: "yaklaşık 15 cm",
    weight: "yaklaşık 200 g",
  },
  {
    week: 19,
    text: "Bebek güçlenir; birçok kadın tekmeleri bu dönemde hissetmeye başlar. Kendine özgü parmak izleri vardır ve hıçkırabilir. Beyin hızla gelişir ve vücut hareketlerini denetlemeye başlar.",
    length: "yaklaşık 16 cm",
    weight: "yaklaşık 240 g",
  },
  {
    week: 20,
    text: "Tırnaklar parmak uçlarına doğru uzar. Beynin beş duyudan sorumlu bölgesi gelişmeyi sürdürür.",
    length: "yaklaşık 20 cm",
    weight: "yaklaşık 350 g",
  },
  {
    week: 21,
    text: "Kol ve bacak hareketleri sık ve uyumludur. Kan hücrelerini üreten kemik iliği çalışmaktadır. Kaşlar, saçlar, göz kapakları ve yüz ifadesi belirginleşir.",
    length: "yaklaşık 27 cm",
    weight: "350–400 g",
  },
  {
    week: 22,
    text: "Bebek sizin kalp atışınızı, nefesinizi ve midenizin sesini duyabilir. Gözde iris oluşmuştur ama göz rengi henüz belli değildir. Çenede diş öncülleri oluşmaya başlar.",
    length: "yaklaşık 28 cm",
    weight: "400–450 g",
  },
  {
    week: 23,
    text: "Akciğerlerdeki damarlar olgunlaşmayı sürdürür. Vücuttaki yağ dokusu hızla artmaya başlar.",
    length: "yaklaşık 29 cm",
    weight: "yaklaşık 500 g",
  },
  {
    week: 24,
    text: "Akciğerlerin yapısı oluşmuştur ama rahim dışında çalışacak olgunluğa henüz ulaşmamıştır; olgunlaşma sonraki haftalarda sürer.",
    length: "yaklaşık 31 cm",
    weight: "yaklaşık 600 g",
  },
  {
    week: 25,
    text: "Artan vücut yağıyla cilt daha az kırışık ve daha dolgun görünür. Sinir sistemi hızla olgunlaşır. Saçlar uzamaya, gözler ve burun delikleri açılmaya başlar.",
    length: "yaklaşık 34 cm",
    weight: "yaklaşık 700 g",
  },
  {
    week: 26,
    text: "Cilde ve gözlere rengini veren melanin üretilmeye başlar. Akciğerler, doğumdan sonra nefes almaya yardım eden sürfaktan adlı maddeyi üretmeye başlar.",
    length: "yaklaşık 35 cm",
    weight: "yaklaşık 910 g",
  },
  {
    week: 27,
    text: "Bebek gözlerini açabilir ve kırpabilir; kirpikleri vardır. Karın duvarından parlak bir ışık gelirse gözlerini kısabilir. Dışarıdan gelen seslere verdiği tepki artar.",
    length: "yaklaşık 37 cm",
    weight: "yaklaşık 1000 g",
  },
  {
    week: 28,
    text: "Beyin dokusu artar ve yüzeyinde kıvrımlar oluşmaya başlar. Bebek doğuma hazırlanırken başını aşağı doğru çevirmeye başlayabilir.",
    length: "yaklaşık 38 cm",
    weight: "yaklaşık 1100 g",
  },
  {
    week: 29,
    text: "Hareketler ritmiktir ve günün belli saatlerinde yoğunlaşır.",
    length: "39–40 cm",
    weight: "1250–1350 g",
  },
  {
    week: 30,
    text: "Bebek kendi vücut ısısını denetleyebilir. Beyni olgunlaşmayı ve hızla büyümeyi sürdürür.",
    length: "40–41 cm",
    weight: "yaklaşık 1400 g",
  },
  {
    week: 31,
    text: "Bebek daha fazla uyaranı işleyebilir.",
    length: "yaklaşık 42 cm",
    weight: "yaklaşık 1520 g",
  },
  {
    week: 32,
    text: "Cilt artık yarı saydam değildir. Akciğerler ve beyin olgunlaşmayı sürdürür; diğer organların çoğu iyi gelişmiştir.",
    length: "yaklaşık 43 cm",
    weight: "yaklaşık 1700 g",
  },
  {
    week: 33,
    text: "Bebek günün büyük bölümünü uyuyarak geçirir. Emme ve yutma refleksi gelişmiştir. Karaciğerinde demir depolamaya başlar.",
    length: "yaklaşık 44 cm",
    weight: "yaklaşık 1900 g",
  },
  {
    week: 34,
    text: "Cildi koruyan verniks tabakası kalınlaşır.",
    length: "yaklaşık 45 cm",
    weight: "yaklaşık 2200 g",
  },
  {
    week: 35,
    text: "Beyin büyümeyi sürdürür; ağırlığı doğumdaki ağırlığının yaklaşık üçte ikisidir. Böbrekler gelişimini tamamlamıştır; karaciğer bazı atıkları işlemeye başlamıştır.",
    length: "yaklaşık 47 cm",
    weight: "yaklaşık 2500 g",
  },
  {
    week: 36,
    text: "Lanugo tüyleri dökülür; bebeğin başında saç vardır. Akciğerler doğumdan sonraki ilk nefese hazırdır.",
    length: "yaklaşık 48 cm",
    weight: "yaklaşık 2750 g",
  },
  {
    week: 37,
    text: "Ayak tırnakları parmak uçlarına ulaşır. Bağırsaklarda, doğumdan sonraki ilk kakayı oluşturacak mekonyum birikmiştir. Bu haftalarda bebek çoğunlukla baş aşağı durur.",
    length: "48–50 cm",
    weight: "yaklaşık 3000 g",
  },
  {
    week: 38,
    text: "Bebek doğumdaki boyutuna ulaşmak için hızla kilo almayı sürdürür.",
    length: "yaklaşık 51 cm",
    weight: "yaklaşık 3100 g",
  },
  {
    week: 39,
    text: "Bebek doğuma hazırdır. Doğum eylemi gebeliğin son ayında herhangi bir zamanda başlayabilir.",
    length: "yaklaşık 52 cm",
    weight: "yaklaşık 3250 g",
  },
  {
    week: 40,
    text: "Bebek doğuma hazırdır. Doğum eylemi gebeliğin son ayında herhangi bir zamanda başlayabilir.",
    length: "yaklaşık 54 cm",
    weight: "yaklaşık 3400 g",
  },
]

const BY_WEEK = new Map(WEEKS.map((w) => [w.week, w]))

/**
 * Verilen (tamamlanan) hafta için içerik. 0–4. haftalar ortak metni döndürür;
 * 40. haftadan sonrası için kaynakta metin olmadığından null döner.
 */
export function weekContent(week: number): WeekContent | null {
  if (!Number.isInteger(week) || week < 0) return null
  if (week <= 4) return { week, text: EARLY_TEXT }
  return BY_WEEK.get(week) ?? null
}

export const ALL_WEEKS: readonly WeekContent[] = WEEKS
