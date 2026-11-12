// Haftaya göre boy benzetmesi ("bir mısır koçanı boyunda").
// Bu liste eğlence içindir ve Sağlık Bakanlığı kaynağında YOKTUR: bizim yazdığımız,
// weeks.ts dosyasındaki yaklaşık boylara göre seçilmiş gündelik benzetmelerdir.
// Ölçü değildir; ekranda her zaman "yaklaşık" boy ve ağırlıkla birlikte gösterilir.
//
// DURUM: Dr. Eray'ın onayı bekleniyor.

const SIZES: Record<number, string> = {
  5: "bir susam tanesi",
  6: "bir nohut tanesi",
  7: "bir yaban mersini",
  8: "bir ahududu",
  9: "bir kiraz",
  10: "bir çilek",
  11: "bir incir",
  12: "bir limon",
  13: "bir şeftali",
  14: "bir elma",
  15: "bir armut",
  16: "bir avokado",
  17: "bir nar",
  18: "bir dolmalık biber",
  19: "bir mango",
  20: "bir muz",
  21: "bir havuç",
  22: "bir kabak",
  23: "bir patlıcan",
  24: "bir mısır koçanı",
  25: "bir karnabahar",
  26: "bir marul",
  27: "bir demet brokoli",
  28: "bir ananas",
  29: "bir bal kabağı",
  30: "bir lahana",
  31: "bir hindistan cevizi",
  32: "bir demet kereviz",
  33: "bir demet pazı",
  34: "bir kavun",
  35: "bir pırasa",
  36: "bir kıvırcık marul",
  37: "bir kış kavunu",
  38: "bir demet pırasa",
  39: "küçük bir karpuz",
  40: "bir karpuz",
}

/** "bir mısır koçanı"; benzetmesi olmayan haftalar (0–4 ve 40 sonrası) için null. */
export function sizeComparison(week: number): string | null {
  return SIZES[week] ?? null
}

export const SIZE_WEEKS: readonly number[] = Object.keys(SIZES).map(Number)
