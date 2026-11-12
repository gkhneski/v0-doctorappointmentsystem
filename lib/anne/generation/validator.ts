import { extractJson, generateContent, geminiApiKey, withRetry } from "@/lib/anne/generation/gemini"

// Ultrason görüntüsünün denetimi. Eski sistemdeki backend/generation/image_validator.py
// dosyasındaki validate_ultrasound_image işlevinin karşılığıdır: aynı model, aynı iki metin,
// aynı geçerlilik kuralı (ultrason + bebek yüzü + kalite >= 30). Metinler DEĞİŞTİRİLMEZ.

export const VALIDATOR_MODEL = "gemini-2.5-flash"

// Satır sonundaki boşluk eski metinde vardır; düzenleyici silmesin diye ${" "} ile yazılır.
export const VALIDATOR_SYSTEM_MESSAGE = `Sen bir ultrason görüntü analiz uzmanısın.${" "}
Verilen görüntüyü analiz et ve SADECE JSON formatında yanıt ver.
Türkçe açıklamalar kullan.
ÖNEMLİ: Gebelik haftası (GA=XXwXd formatında) bilgisini mutlaka oku!`

export const VALIDATOR_PROMPT = `Bu ultrason görüntüsünü DİKKATLİCE analiz et:

1. Bu bir ultrason/sonogram görüntüsü mü?

2. Görüntüde bebek/fetus yüzü görünüyor mu?

3. Eğer yüz varsa, hangi açıdan? (profil/yandan mı, frontal/önden mi?)

4. **ÇOK ÖNEMLİ**: Görüntüde "GA=" yazısını bul!${" "}
   - Örnek: "GA=22w1d" demek 22 hafta 1 gün demek
   - Örnek: "GA=19w0d" demek 19 hafta 0 gün demek
   - Bu bilgi genellikle görüntünün köşesinde yazıyor
   - Eğer GA bilgisi yoksa "not_found" yaz

5. Görüntü kalitesi 0-100 arası puan ver

6. Sorunları listele

SADECE bu JSON formatında yanıt ver, başka bir şey yazma:
{
    "is_ultrasound": true/false,
    "has_fetal_face": true/false,
    "face_view": "profile" veya "frontal" veya "unknown",
    "gestational_age": "22w1d" veya "not_found",
    "gestational_weeks": 22,
    "quality_score": 0-100,
    "issues": ["sorun1", "sorun2"],
    "description": "Kısa açıklama"
}`

export type ImageValidation = {
  is_valid: boolean
  is_ultrasound?: boolean
  has_fetal_face?: boolean
  face_view?: string
  gestational_age?: string
  gestational_weeks?: number | null
  quality_score?: number
  issues?: string[]
  description?: string
  error?: string
  /** Denetim hiç yapılamadı (bağlantı, yoğunluk); görüntü hakkında bir şey söylemez. */
  unavailable?: boolean
}

export function parseValidationResponse(raw: string): ImageValidation {
  const result = extractJson(raw)
  if (!result) return { is_valid: false, error: "AI yanıtı parse edilemedi" }

  let weeks: number | null | undefined
  if ("gestational_weeks" in result) {
    const n = Number.parseInt(String(result.gestational_weeks), 10)
    weeks = Number.isNaN(n) ? null : n
  }

  const quality = typeof result.quality_score === "number" ? result.quality_score : 0
  return {
    ...(result as Partial<ImageValidation>),
    ...(weeks !== undefined ? { gestational_weeks: weeks } : {}),
    issues: Array.isArray(result.issues) ? result.issues.filter((i): i is string => typeof i === "string") : [],
    is_valid: result.is_ultrasound === true && result.has_fetal_face === true && quality >= 30,
  }
}

export async function validateUltrasoundImage(
  image: Buffer,
  options: { fetchImpl?: typeof fetch; wait?: (ms: number) => Promise<unknown>; timeoutMs?: number } = {},
): Promise<ImageValidation> {
  const apiKey = geminiApiKey()
  if (!apiKey) return { is_valid: false, error: "GEMINI_API_KEY bulunamadı", unavailable: true }

  try {
    const response = await withRetry(
      "ImageValidator",
      3,
      3000,
      () =>
        generateContent({
          apiKey,
          model: VALIDATOR_MODEL,
          images: [image],
          prompt: VALIDATOR_SYSTEM_MESSAGE + "\n\n" + VALIDATOR_PROMPT,
          timeoutMs: options.timeoutMs ?? 60_000,
          fetchImpl: options.fetchImpl,
        }),
      options.wait,
    )
    return parseValidationResponse(response.text)
  } catch (error) {
    return { is_valid: false, error: error instanceof Error ? error.message : String(error), unavailable: true }
  }
}
