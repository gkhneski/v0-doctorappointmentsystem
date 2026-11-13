// Google'ın görüntüden video üreten modeli (Gemini Omni). Veo, Gemini API'de 22 Ekim 2026'da
// kapatıldı; yerine bu model geldi. Belge: https://aistudio.google.com/docs/omni
//   POST /v1beta/interactions  { model, input: [görüntü, metin], response_format: { type: "video", ... } }
// Yanıt eşzamanlıdır; video, "model_output" adımının içinde base64 MP4 olarak gelir.

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions"

export const OMNI_MODEL = "gemini-omni-1.2-flash"

export type OmniVideoRequest = {
  apiKey: string
  /** İlk kare olacak görüntü (JPEG). */
  image: Buffer
  prompt: string
  aspectRatio: "9:16" | "16:9"
  resolution: string
  duration: string
  timeoutMs: number
  fetchImpl?: typeof fetch
}

/** Yanıtın neresinde olursa olsun ilk video parçasını bulur. */
function findVideo(node: unknown): { data?: string; uri?: string } | null {
  if (!node || typeof node !== "object") return null
  const record = node as Record<string, unknown>
  if (record.type === "video" && (typeof record.data === "string" || typeof record.uri === "string")) {
    return { data: record.data as string | undefined, uri: record.uri as string | undefined }
  }
  for (const value of Object.values(record)) {
    const found = findVideo(value)
    if (found) return found
  }
  return null
}

/** Görüntüyü kısa bir videoya çevirir; MP4 baytlarını döndürür. Başarısızsa hata fırlatır. */
export async function generateVideo(request: OmniVideoRequest): Promise<Buffer> {
  const doFetch = request.fetchImpl ?? fetch
  let response: Response
  try {
    response = await doFetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": request.apiKey },
      body: JSON.stringify({
        model: OMNI_MODEL,
        input: [
          { type: "image", data: request.image.toString("base64"), mime_type: "image/jpeg" },
          { type: "text", text: request.prompt },
        ],
        response_format: { type: "video", aspect_ratio: request.aspectRatio, resolution: request.resolution, duration: request.duration },
        // Görüntü ve yanıt Google'da saklanmasın.
        store: false,
      }),
      signal: AbortSignal.timeout(request.timeoutMs),
    })
  } catch (error) {
    const name = error instanceof Error ? error.name : ""
    if (name === "TimeoutError" || name === "AbortError") throw new Error("Deadline exceeded")
    throw new Error(`Omni bağlantı hatası: ${error instanceof Error ? error.message : String(error)}`)
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(`${response.status} ${payload?.error?.status ?? ""}. ${payload?.error?.message ?? ""}`.trim())
  }

  const video = findVideo(payload)
  if (video?.data) return Buffer.from(video.data, "base64")
  if (video?.uri) {
    const download = await doFetch(video.uri, { headers: { "x-goog-api-key": request.apiKey }, signal: AbortSignal.timeout(60_000) })
    if (!download.ok) throw new Error(`Video indirilemedi: ${download.status}`)
    return Buffer.from(await download.arrayBuffer())
  }
  throw new Error(`Omni video döndürmedi (durum: ${payload?.status ?? "bilinmiyor"})`)
}

/** MP4 mü? ("ftyp" kutusu dosyanın başındadır.) */
export function isMp4(bytes: Uint8Array): boolean {
  return bytes.length > 12 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70
}
