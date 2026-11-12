// Tarayıcıdan /api/anne yollarına istek. Hata durumunda ekranda gösterilecek cümleyi de döndürür.

export type ApiResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; error: string }

export async function send<T = Record<string, unknown>>(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: unknown,
  fallback = "İşlem yapılamadı. Lütfen yeniden deneyin.",
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method,
      headers: body === undefined || body instanceof FormData ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return { ok: false, status: response.status, error: typeof data.error === "string" ? data.error : fallback }
    }
    return { ok: true, status: response.status, data: data as T }
  } catch {
    return { ok: false, status: 0, error: "Bağlantı kurulamadı. İnternetinizi kontrol edip yeniden deneyin." }
  }
}
