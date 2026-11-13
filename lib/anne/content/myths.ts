import type { SourceKey } from "@/lib/anne/content/sources"
import { daysBetween } from "@/lib/anne/pregnancy"

// "Doğru mu, efsane mi?" oyunu. Her kart bir cümledir; anne doğru ya da efsane der.
// Cümlelerin yanıtı ya uygulamadaki Bakanlık kaynaklı içerikte (hafta hafta gelişim, izlem
// takvimi, tehlike işaretleri) ya da künyesi verilen hakemli bir araştırmada bulunur.
// Kaynakta olmayan bilgi sorulmaz. Kartlar genel bilgidir, kişiye özel yönlendirme değildir.
//
// DURUM: Dr. Eray'ın onayı bekleniyor.

export type Myth = {
  id: string
  /** Kartta yazan cümle. */
  text: string
  /** Cümle doğru mu? */
  truth: boolean
  explanation: string
  source: SourceKey
}

export const MYTHS: readonly Myth[] = [
  {
    id: "mide-yanmasi",
    text: "Miden çok yanıyorsa bebeğin saçlı doğar.",
    truth: true,
    explanation:
      "Şaşırtıcı ama doğruluk payı var. 64 gebeyle yapılan bir araştırmada, mide yanması çok olanların çoğunun bebeği gür saçlı doğdu. Bu bir ilişkidir; kesin bir kural değildir.",
    source: "mideYanmasi",
  },
  {
    id: "seker-testi",
    text: "Şeker yükleme testi gebeliğin son ayında yapılır.",
    truth: false,
    explanation: "Gebelik şekeri taraması 24–28. haftalar arasında yapılır.",
    source: "dogumOncesi",
  },
  {
    id: "tat",
    text: "Bebek, annesinin yediklerinin tadına karnındayken tepki verebilir.",
    truth: true,
    explanation:
      "100 gebeyle yapılan bir araştırmada, anne havuç aldıktan sonra bebekler ultrasonda daha çok gülen yüz, lahana aldıktan sonra daha çok ağlayan yüz ifadesi yaptı.",
    source: "tatDurham",
  },
  {
    id: "parmak-izi",
    text: "Bebeğin parmak izi doğumdan sonra oluşur.",
    truth: false,
    explanation: "Parmak izleri bebek daha karnındayken oluşur ve kendine özgüdür.",
    source: "gebeOkulu",
  },
  {
    id: "hareket-azalmasi",
    text: "Bebeğin hareketlerinin azalması önemsenmeyecek bir durumdur.",
    truth: false,
    explanation: "Bebek hareketlerinin azalması tehlike işaretlerindendir; beklemeden bir sağlık kuruluşuna başvurulur.",
    source: "dogumOncesi",
  },
  {
    id: "kalp-atisi",
    text: "Bebek karnındayken annesinin kalp atışını duyabilir.",
    truth: true,
    explanation: "Bebek annesinin kalp atışını, nefesini ve midesinin sesini duyabilir.",
    source: "gebeOkulu",
  },
  {
    id: "kelimeler",
    text: "Bebek karnındayken sesleri bizim duyduğumuz kadar net duyar.",
    truth: false,
    explanation:
      "Annenin dokuları tiz sesleri süzer; bebeğe sesin en çok kalın kısmı, ezgisi ve ritmi ulaşır. Yenidoğanlar annelerinin bu şekilde süzülmüş sesini tercih eder.",
    source: "rahimdeSes",
  },
  {
    id: "hickirik",
    text: "Bebek karnındayken hıçkırabilir.",
    truth: true,
    explanation: "Bebek karnındayken hıçkırabilir; birçok anne bunu düzenli küçük hareketler olarak hisseder.",
    source: "gebeOkulu",
  },
  {
    id: "gozler",
    text: "Bebek doğana kadar gözlerini hiç açmaz.",
    truth: false,
    explanation: "Bebek karnındayken gözlerini açabilir ve kırpabilir; kirpikleri de vardır.",
    source: "gebeOkulu",
  },
  {
    id: "izlem-sayisi",
    text: "Sağlık Bakanlığı her gebenin en az dört kez izlenmesini önerir.",
    truth: true,
    explanation: "En az dört izlem önerilir; doktorun seni daha sık görebilir.",
    source: "dogumOncesi",
  },
  {
    id: "su-gelmesi",
    text: "Su gelirse ertesi günü beklemek yeterlidir.",
    truth: false,
    explanation: "Su gelmesi tehlike işaretlerindendir; beklemeden bir sağlık kuruluşuna başvurulur.",
    source: "dogumOncesi",
  },
  {
    id: "isik",
    text: "Karnına parlak bir ışık tutulursa bebek tepki verebilir.",
    truth: true,
    explanation: "Karın duvarından parlak bir ışık gelirse bebek gözlerini kısabilir.",
    source: "gebeOkulu",
  },
]

/** Bir oturumda gösterilen kart sayısı. */
export const MYTHS_PER_DAY = 5

const EPOCH = "2026-01-01"

/** O günün kartları: herkese aynı gün aynı kartlar; ertesi gün sıradakiler. */
export function mythsOfDay(today: string): Myth[] {
  const start = (((daysBetween(EPOCH, today) * MYTHS_PER_DAY) % MYTHS.length) + MYTHS.length) % MYTHS.length
  return Array.from({ length: MYTHS_PER_DAY }, (_, i) => MYTHS[(start + i) % MYTHS.length])
}
