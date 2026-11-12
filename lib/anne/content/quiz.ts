import type { SourceKey } from "@/lib/anne/content/sources"
import { daysBetween } from "@/lib/anne/pregnancy"

// "Günün sorusu" oyunu. Her sorunun doğru yanıtı uygulamadaki Bakanlık kaynaklı içerikte
// (izlem takvimi, tehlike işaretleri) aynen bulunur; kaynakta olmayan bilgi sorulmaz.
// Sorular genel bilgidir, kişiye özel yönlendirme değildir.
//
// DURUM: Dr. Eray'ın onayı bekleniyor.

export type QuizQuestion = {
  id: string
  /** Sorunun kalın yazılan ilk bölümü. */
  lead: string
  /** Sorunun devamı. */
  rest: string
  options: readonly [string, string, string]
  /** Doğru şıkkın sırası (0–2). */
  answer: 0 | 1 | 2
  explanation: string
  source: SourceKey
}

export const QUIZ: readonly QuizQuestion[] = [
  {
    id: "seker-taramasi",
    lead: "Şeker yükleme testi",
    rest: "hangi haftalarda yapılır?",
    options: ["12–14. haftalar", "24–28. haftalar", "36–38. haftalar"],
    answer: 1,
    explanation: "Gebelik şekeri taraması 24–28. haftalar arasında yapılır.",
    source: "dogumOncesi",
  },
  {
    id: "izlem-sayisi",
    lead: "Sağlık Bakanlığı",
    rest: "her gebenin en az kaç kez izlenmesini önerir?",
    options: ["İki kez", "Dört kez", "On kez"],
    answer: 1,
    explanation: "En az dört izlem önerilir; doktorun seni daha sık görebilir.",
    source: "dogumOncesi",
  },
  {
    id: "izlem-3",
    lead: "Üçüncü izlem",
    rest: "hangi haftalar arasındadır?",
    options: ["18–24. haftalar", "28–32. haftalar", "36–38. haftalar"],
    answer: 1,
    explanation: "Üçüncü izlem 28–32. haftalar arasındadır.",
    source: "dogumOncesi",
  },
  {
    id: "izlem-4",
    lead: "Dördüncü izlem",
    rest: "hangi haftalar arasındadır?",
    options: ["28–32. haftalar", "32–34. haftalar", "36–38. haftalar"],
    answer: 2,
    explanation: "Dördüncü izlem 36–38. haftalar arasındadır.",
    source: "dogumOncesi",
  },
  {
    id: "tetanoz",
    lead: "Tetanos aşısı",
    rest: "gebeliğin hangi haftaları arasında yapılır?",
    options: ["5–10. haftalar", "18–32. haftalar", "38–40. haftalar"],
    answer: 1,
    explanation: "Tetanos aşısı 18–32. haftalar arasında yapılır; kaç doz olacağı aşı kaydına göre belirlenir.",
    source: "dogumOncesi",
  },
  {
    id: "su-gelmesi",
    lead: "Su gelmesi",
    rest: "olursa ne yapılır?",
    options: ["Ertesi gün beklenir", "Beklemeden sağlık kuruluşuna başvurulur", "Bir sonraki izlemde söylenir"],
    answer: 1,
    explanation: "Su gelmesi gebelikteki tehlike işaretlerindendir; beklemeden bir sağlık kuruluşuna başvurulur.",
    source: "dogumOncesi",
  },
  {
    id: "hareket-azalmasi",
    lead: "Bebek hareketlerinin azalması",
    rest: "tehlike işaretleri arasında mıdır?",
    options: ["Evet", "Hayır", "Yalnızca son haftada"],
    answer: 0,
    explanation: "Bebek hareketlerinin azalması tehlike işaretlerindendir; beklemeden başvurulur.",
    source: "dogumOncesi",
  },
]

const EPOCH = "2026-01-01"

/** O günün sorusu: herkese aynı gün aynı soru. */
export function questionOfDay(today: string): QuizQuestion {
  const index = ((daysBetween(EPOCH, today) % QUIZ.length) + QUIZ.length) % QUIZ.length
  return QUIZ[index]
}
