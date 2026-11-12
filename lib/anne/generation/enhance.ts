import type { AiParameters } from "@/lib/anne/generation/biometrics"
import { generateContent, geminiApiKey, isTransient, sleep } from "@/lib/anne/generation/gemini"
import { addPolaroidFrame, removeScanLines } from "@/lib/anne/generation/postprocess"
import { buildScientificPrompt, fullGeminiPrompt, fullReplicatePrompt } from "@/lib/anne/generation/prompt"

// Bebek yüzü üretimi. Eski sistemdeki iki dosyanın karşılığıdır:
//   backend/generation/ultrasound_4k.py            -> enhanceUltrasoundScientific (Google, birincil)
//   backend/generation/ultrasound_4k_replicate.py  -> replicateFallback (yedek)
//
// Eski sistemin kuralları aynen korunur:
//   * Birincil model gemini-3-pro-image-preview; yedek Replicate üzerindeki google/nano-banana.
//   * İki sağlayıcıya giden yönerge aynıdır (buildScientificPrompt).
//   * Geçici hatada (503 / UNAVAILABLE / Deadline) 3 deneme, 3 / 6 / 9 saniye bekleme.
//   * Google başarısız olursa ya da görüntü döndürmezse yedeğe geçilir; üçüncü bir yol yoktur.
//   * Üretilen görüntü önce çizgi temizliğinden, sonra çerçeveden geçer.

export const PRIMARY_MODEL = "gemini-3-pro-image-preview"
export const REPLICATE_MODEL = "google/nano-banana"

export type EnhanceResult =
  | { success: true; image: Buffer; promptUsed: string; model: string; provider: "gemini" | "replicate_fallback" }
  | { success: false; error: string }

export type EnhanceOptions = {
  /** Çerçevenin ortasına yazılan ad (eski sistemde hastanın adı). */
  patientName?: string
  fetchImpl?: typeof fetch
  wait?: (ms: number) => Promise<unknown>
  env?: Record<string, string | undefined>
  /** Tek bir Google denemesinin zaman sınırı. */
  geminiTimeoutMs?: number
  /** Yedek sağlayıcının toplam zaman sınırı (eski sistemde 120 saniye). */
  replicateTimeoutMs?: number
  /** Sunucunun işi bitirmek zorunda olduğu an (epoch ms). Zaman sınırları bunu aşmayacak şekilde kısalır. */
  deadlineAt?: number
}

async function finish(raw: Buffer, patientName: string): Promise<Buffer> {
  const cleaned = await removeScanLines(raw)
  // Eski sistem çerçevenin altına "Ultrason 4K", hastanın adını ve doktor adı + site adresini
  // yazıyordu. Kullanıcı 12.11.2026'da bu yazıların kaldırılmasını istedi (ana plan 9e);
  // çerçeve aynı, altı boş.
  void patientName
  return addPolaroidFrame(cleaned, { withText: false })
}

export async function enhanceUltrasoundScientific(
  image: Buffer,
  params: AiParameters,
  options: EnhanceOptions = {},
): Promise<EnhanceResult> {
  const env = options.env ?? process.env
  const wait = options.wait ?? sleep
  const patientName = options.patientName ?? ""
  const fallback = () => replicateFallback(image, params, options)

  try {
    const apiKey = geminiApiKey(env)
    if (!apiKey) return { success: false, error: "GEMINI_API_KEY not configured" }

    let response: Awaited<ReturnType<typeof generateContent>> | null = null
    let lastError: unknown = null
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await generateContent({
          apiKey,
          model: PRIMARY_MODEL,
          images: [image],
          prompt: fullGeminiPrompt(params),
          responseModalities: ["image", "text"],
          timeoutMs: within(options.geminiTimeoutMs ?? 90_000, options.deadlineAt),
          fetchImpl: options.fetchImpl,
        })
        break
      } catch (error) {
        lastError = error
        if (isTransient(error)) {
          console.warn(`[Ultrasound4K Scientific] 503 retry ${attempt + 1}/3`)
          await wait(within(3000 * (attempt + 1), options.deadlineAt))
          continue
        }
        // Geçici olmayan hata: yedeğe geç
        response = null
        break
      }
    }

    if (response === null) {
      console.warn(`[Ultrasound4K Scientific] Gemini failed (${describe(lastError)}); using Replicate fallback`)
      return await fallback()
    }

    if (response.image) {
      return {
        success: true,
        image: await finish(response.image.bytes, patientName),
        promptUsed: buildScientificPrompt(params),
        model: PRIMARY_MODEL,
        provider: "gemini",
      }
    }

    console.warn("[Ultrasound4K Scientific] Gemini empty response; using Replicate fallback.")
    return await fallback()
  } catch (error) {
    console.error(`[Ultrasound4K Scientific] Error: ${describe(error)}`)
    try {
      return await fallback()
    } catch {
      return { success: false, error: `İşlem hatası: ${describe(error)}` }
    }
  }
}

/** Zaman sınırını, işin bitmesi gereken ana göre kısaltır (en az 1 saniye). */
function within(limitMs: number, deadlineAt?: number): number {
  if (!deadlineAt) return limitMs
  return Math.max(1000, Math.min(limitMs, deadlineAt - Date.now()))
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

// ---- Yedek sağlayıcı ----

const REPLICATE_API = "https://api.replicate.com/v1"

async function replicateFallback(image: Buffer, params: AiParameters, options: EnhanceOptions): Promise<EnhanceResult> {
  const env = options.env ?? process.env
  const doFetch = options.fetchImpl ?? fetch
  const wait = options.wait ?? sleep
  const token = env.REPLICATE_API_TOKEN

  try {
    if (!token) return { success: false, error: "REPLICATE_API_TOKEN not configured" }
    const auth = { Authorization: `Bearer ${token}` }
    const deadline = Date.now() + within(options.replicateTimeoutMs ?? 120_000, options.deadlineAt)
    const remaining = () => Math.max(1000, deadline - Date.now())

    // Girdi görüntüsü Replicate'in dosya deposuna yüklenir (eski kitaplık da böyle yapıyordu).
    const form = new FormData()
    form.set("content", new Blob([new Uint8Array(image)], { type: "image/jpeg" }), "input.jpg")
    const upload = await doFetch(`${REPLICATE_API}/files`, { method: "POST", headers: auth, body: form, signal: AbortSignal.timeout(remaining()) })
    const uploaded = await upload.json().catch(() => null)
    const inputUrl = uploaded?.urls?.get
    if (!upload.ok || typeof inputUrl !== "string") {
      return { success: false, error: `Replicate fallback hatası: görüntü yüklenemedi (${upload.status})` }
    }

    const start = await doFetch(`${REPLICATE_API}/models/${REPLICATE_MODEL}/predictions`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ input: { prompt: fullReplicatePrompt(params), image_input: [inputUrl], output_format: "png" } }),
      signal: AbortSignal.timeout(remaining()),
    })
    let prediction = await start.json().catch(() => null)
    if (!start.ok || !prediction?.urls?.get) {
      return { success: false, error: `Replicate fallback hatası: ${prediction?.detail ?? start.status}` }
    }

    while (prediction.status === "starting" || prediction.status === "processing") {
      if (Date.now() >= deadline) return { success: false, error: "Replicate fallback timeout (>120s)" }
      await wait(2000)
      const poll = await doFetch(prediction.urls.get, { headers: auth, signal: AbortSignal.timeout(remaining()) })
      prediction = await poll.json().catch(() => null)
      if (!poll.ok || !prediction) return { success: false, error: `Replicate fallback hatası: durum okunamadı (${poll.status})` }
    }
    if (prediction.status !== "succeeded") {
      return { success: false, error: `Replicate fallback hatası: ${prediction.error ?? prediction.status}` }
    }

    const output = prediction.output
    const outputUrl = typeof output === "string" ? output : Array.isArray(output) && typeof output[0] === "string" ? output[0] : null
    if (!outputUrl) return { success: false, error: "Replicate çıktı vermedi" }

    // Üretilen görüntüyü indir (geçici ağ sorunlarına karşı 3 deneme)
    let generated: Buffer | null = null
    let lastDownloadError: unknown = null
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (options.deadlineAt && Date.now() >= options.deadlineAt) break
        const file = await doFetch(outputUrl, { signal: AbortSignal.timeout(within(60_000, options.deadlineAt)) })
        if (!file.ok) throw new Error(`HTTP ${file.status}`)
        generated = Buffer.from(await file.arrayBuffer())
        break
      } catch (error) {
        lastDownloadError = error
        console.warn(`[Replicate Fallback] download retry ${attempt + 1}/3: ${describe(error)}`)
        await wait(within(2000 * (attempt + 1), options.deadlineAt))
      }
    }
    if (!generated) return { success: false, error: `Replicate çıktı indirilemedi: ${describe(lastDownloadError)}` }

    return {
      success: true,
      image: await finish(generated, options.patientName ?? ""),
      promptUsed: buildScientificPrompt(params),
      model: REPLICATE_MODEL,
      provider: "replicate_fallback",
    }
  } catch (error) {
    const name = error instanceof Error ? error.name : ""
    if (name === "TimeoutError" || name === "AbortError") return { success: false, error: "Replicate fallback timeout (>120s)" }
    console.error(`[Ultrasound4K Replicate Fallback] Error: ${describe(error)}`)
    return { success: false, error: `Replicate fallback hatası: ${describe(error)}` }
  }
}
