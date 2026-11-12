import { generateContent, geminiApiKey, withRetry } from "@/lib/anne/generation/gemini"

// Ölçüm kâğıdını okuma. Eski sistemdeki backend/generation/biometric_ocr.py dosyasının
// karşılığıdır: aynı model (gemini-2.5-flash), aynı iki metin, aynı yeniden deneme düzeni
// (5 deneme, 5/10/15/20/25 saniye bekleme). Metinler DEĞİŞTİRİLMEZ.

export const OCR_MODEL = "gemini-2.5-flash"

export const OCR_SYSTEM_PROMPT = `Sen bir obstetrik ultrason uzmanısın. Sana verilen görüntü ya bir doktorun el yazısı ile yazdığı biyometrik ölçüm notları, ya da bir ultrason cihazı ekranının fotoğrafıdır.

Görevin: Görüntüden aşağıdaki TÜM fetal biyometrik ölçümleri (mm cinsinden) bulmak ve çıkarmaktır.

HADLOCK PARAMETRELERİ:
- bpd: BPD (Biparietal Diameter / Kafa Genişliği) — tipik: 20-100 mm
- ofd: OFD (Occipitofrontal Diameter / Ön-Arka Baş / Önarka baş) — tipik: 20-120 mm
- hc: HC (Head Circumference / Kafa Çevresi) — tipik: 80-400 mm
- ac: AC (Abdominal Circumference / Karın Çevresi) — tipik: 50-400 mm
- fl: FL (Femur Length / Femur Uzunluğu) — tipik: 10-80 mm

BEYİN PARAMETRELERİ:
- cerebellum: Cerebellum (Serebellum / Cereb) — tipik: 5-60 mm
- cisterna_magna: CM (Cisterna Magna) — tipik: 1-15 mm
- nuchal_fold: NF (Nuchal Fold / Ense Kalınlığı) — tipik: 1-10 mm

YÜZ PARAMETRELERİ:
- fromen: Fromen (Alın Genişliği) — tipik: 10-100 mm
- nasal_bone: Burun / Nasal Bone (NBL) — tipik: 2-20 mm
- iod: Göztepe / IOD (Inter-Orbital Distance / Göz Arası Mesafe) — tipik: 5-40 mm
- bioc_cap: BiocÇap / Biokuler Çap — tipik: 10-50 mm
- chin: Çene — tipik: 2-15 mm
- mouth_diameter: Ağız Çapı / AğızÇapı — tipik: 5-30 mm
- eye: Göz — tipik: 3-20 mm
- upper_lip: Üst Dudak — tipik: 2-10 mm

JEANTY PARAMETRELERİ (KEMİK):
- humerus: HL / Humerus Length — tipik: 10-70 mm
- tibia: TIB / Tibia — tipik: 10-70 mm
- fibula: FIB / Fibula — tipik: 10-65 mm
- radius: RAD / Radius — tipik: 10-60 mm
- ulna: Ulna — tipik: 10-65 mm

ÖNEMLI: Ultrason makine ekranlarında değerler CM cinsinden gösterilir! Bunları MM'ye çevir (x10).
Örn: BPD: 6.37 cm = 63.7 mm, HC: 23.51 cm = 235.1 mm

KURALLAR:
1. Sadece görüntüde AÇIKÇA okunan/görünen değerleri döndür
2. Okuyamadığın veya bulamadığın ölçümler için null döndür
3. Değerleri MM cinsinden sayısal olarak döndür (birim ekleme)
4. CM cinsinden olan değerleri otomatik olarak MM'ye çevir (x10)
5. El yazısı kötü okunuyorsa en iyi tahmini yap
6. Türkçe alan isimlerini tanı: Burun=nasal_bone, Göztepe=iod, BiocÇap=bioc_cap, Çene=chin, AğızÇapı=mouth_diameter, Önarka baş=ofd, Göz=eye, Üst Dudak=upper_lip, Fromen=fromen
7. SADECE JSON formatında yanıt ver, başka metin ekleme

YANIT FORMATI (SADECE bu JSON):
{
  "success": true,
  "bpd": <sayı veya null>,
  "ofd": <sayı veya null>,
  "hc": <sayı veya null>,
  "ac": <sayı veya null>,
  "fl": <sayı veya null>,
  "cerebellum": <sayı veya null>,
  "cisterna_magna": <sayı veya null>,
  "nuchal_fold": <sayı veya null>,
  "fromen": <sayı veya null>,
  "nasal_bone": <sayı veya null>,
  "iod": <sayı veya null>,
  "bioc_cap": <sayı veya null>,
  "chin": <sayı veya null>,
  "mouth_diameter": <sayı veya null>,
  "eye": <sayı veya null>,
  "upper_lip": <sayı veya null>,
  "humerus": <sayı veya null>,
  "tibia": <sayı veya null>,
  "fibula": <sayı veya null>,
  "radius": <sayı veya null>,
  "ulna": <sayı veya null>,
  "confidence": <0-100 arası genel güven skoru>,
  "source_type": "handwritten" veya "machine_screen" veya "unknown",
  "notes": "<ek açıklama veya uyarı>"
}`

export const OCR_USER_PROMPT = `Bu görüntüdeki TÜM fetal biyometrik ölçümleri oku ve JSON olarak döndür. El yazısı not veya ultrason cihaz ekranı olabilir. Tüm değerleri mm cinsinden ver. CM cinsindeki değerleri 10 ile çarparak MM'ye çevir.`

export const OCR_MEASUREMENT_KEYS = [
  "bpd",
  "ofd",
  "hc",
  "ac",
  "fl",
  "cerebellum",
  "cisterna_magna",
  "nuchal_fold",
  "fromen",
  "nasal_bone",
  "iod",
  "bioc_cap",
  "chin",
  "mouth_diameter",
  "eye",
  "upper_lip",
  "humerus",
  "tibia",
  "fibula",
  "radius",
  "ulna",
] as const

export type OcrResult =
  | ({ success: true; found_count: number } & Record<string, unknown>)
  | { success: false; error: string; found_count?: number; transient?: boolean }

/** Yanıtı eski sistemin yaptığı gibi çözer: baştaki/sondaki kod çitini atar, JSON okur, bulunanları sayar. */
export function parseOcrResponse(raw: string): OcrResult {
  let text = raw.trim()
  if (text.startsWith("```")) {
    text = text.includes("\n") ? text.slice(text.indexOf("\n") + 1) : text.slice(3)
    if (text.endsWith("```")) text = text.slice(0, -3)
    text = text.trim()
  }

  let result: Record<string, unknown>
  try {
    const parsed = JSON.parse(text)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("nesne değil")
    result = parsed
  } catch (error) {
    return { success: false, error: `JSON parse hatası: ${error instanceof Error ? error.message : String(error)}` }
  }

  const found = OCR_MEASUREMENT_KEYS.filter((key) => result[key] !== null && result[key] !== undefined).length
  if (found === 0) return { success: false, found_count: 0, error: "Görüntüde ölçüm değeri bulunamadı" }
  return { ...result, success: true, found_count: found }
}

export async function extractBiometricsFromImage(
  image: Buffer,
  options: { fetchImpl?: typeof fetch; wait?: (ms: number) => Promise<unknown>; timeoutMs?: number } = {},
): Promise<OcrResult> {
  const apiKey = geminiApiKey()
  if (!apiKey) return { success: false, error: "GEMINI_API_KEY bulunamadı" }

  try {
    const response = await withRetry(
      "BiometricOCR",
      5,
      5000,
      () =>
        generateContent({
          apiKey,
          model: OCR_MODEL,
          images: [image],
          prompt: OCR_SYSTEM_PROMPT + "\n\n" + OCR_USER_PROMPT,
          timeoutMs: options.timeoutMs ?? 60_000,
          fetchImpl: options.fetchImpl,
        }),
      options.wait,
    )
    return parseOcrResponse(response.text)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: `OCR hatası: ${message}`, transient: /503|UNAVAILABLE|Deadline/.test(message) }
  }
}
