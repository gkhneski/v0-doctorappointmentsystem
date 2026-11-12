// Google Gemini çağrısı. Eski sistem Python kitaplığıyla
//   client.aio.models.generate_content(model=..., contents=[image_part, full_prompt])
// çağırıyordu; bu, tek bir kullanıcı iletisi içinde önce görüntü, sonra metin demektir.
// Burada aynı istek doğrudan Google'ın adresine gönderilir.

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models"

export type GeminiImage = { bytes: Buffer; mimeType: string }

export type GeminiResult = {
  /** Yanıttaki metin parçaları (birleştirilmiş). */
  text: string
  /** Yanıttaki son görüntü; yoksa null. */
  image: GeminiImage | null
}

export function geminiApiKey(env: Record<string, string | undefined> = process.env): string | null {
  return env.GEMINI_API_KEY || env.GOOGLE_GENERATIVE_AI_API_KEY || null
}

/** Eski sistemin yeniden deneme koşulu: geçici yoğunluk ya da zaman aşımı. */
export function isTransient(error: unknown): boolean {
  const text = String(error instanceof Error ? error.message : error)
  return text.includes("503") || text.includes("UNAVAILABLE") || text.includes("Deadline")
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function generateContent(options: {
  apiKey: string
  model: string
  /** Sırayla gönderilecek görüntüler; hepsi eski sistemdeki gibi "image/jpeg" olarak etiketlenir. */
  images: Buffer[]
  prompt: string
  /** Görüntü üretimi için ["image", "text"]; metin yanıtı için boş bırakılır. */
  responseModalities?: string[]
  timeoutMs: number
  fetchImpl?: typeof fetch
}): Promise<GeminiResult> {
  const doFetch = options.fetchImpl ?? fetch
  const body: Record<string, unknown> = {
    contents: [
      {
        role: "user",
        parts: [
          ...options.images.map((bytes) => ({ inlineData: { mimeType: "image/jpeg", data: bytes.toString("base64") } })),
          { text: options.prompt },
        ],
      },
    ],
  }
  if (options.responseModalities) body.generationConfig = { responseModalities: options.responseModalities }

  let response: Response
  try {
    response = await doFetch(`${ENDPOINT}/${options.model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": options.apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(options.timeoutMs),
    })
  } catch (error) {
    const name = error instanceof Error ? error.name : ""
    if (name === "TimeoutError" || name === "AbortError") throw new Error("Deadline exceeded")
    throw new Error(`Gemini bağlantı hatası: ${error instanceof Error ? error.message : String(error)}`)
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const status = payload?.error?.status ?? ""
    const message = payload?.error?.message ?? ""
    throw new Error(`${response.status} ${status}. ${message}`.trim())
  }

  let text = ""
  let image: GeminiImage | null = null
  for (const part of payload?.candidates?.[0]?.content?.parts ?? []) {
    const inline = part?.inlineData ?? part?.inline_data
    if (inline?.data) {
      image = { bytes: Buffer.from(inline.data, "base64"), mimeType: inline.mimeType ?? inline.mime_type ?? "image/png" }
    } else if (typeof part?.text === "string" && part.thought !== true) {
      text += part.text
    }
  }
  return { text, image }
}

/**
 * Geçici hatalarda yeniden dener: `attempts` deneme, her denemeden sonra `backoffMs * deneme no` bekler.
 * Geçici olmayan hata hemen fırlatılır; denemeler tükenirse son hata fırlatılır.
 */
export async function withRetry<T>(
  label: string,
  attempts: number,
  backoffMs: number,
  run: () => Promise<T>,
  wait: (ms: number) => Promise<unknown> = sleep,
): Promise<T> {
  let last: unknown
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await run()
    } catch (error) {
      last = error
      if (!isTransient(error)) throw error
      console.warn(`[${label}] 503 retry ${attempt + 1}/${attempts}`)
      await wait(backoffMs * (attempt + 1))
    }
  }
  throw last
}

/** Yanıt metnindeki ilk "{ ... }" bloğunu JSON olarak okur. */
export function extractJson(text: string): Record<string, unknown> | null {
  const match = /\{[\s\S]*\}/.exec(text)
  if (!match) return null
  try {
    const value = JSON.parse(match[0])
    return value && typeof value === "object" && !Array.isArray(value) ? value : null
  } catch {
    return null
  }
}
