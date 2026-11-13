import { describe, it, expect } from "vitest"
import sharp from "sharp"
import { createFakeSupabase } from "../helpers/fake-supabase"
import { MOMENTS, dailyWords, momentPrompt, nextMomentKind } from "@/lib/anne/animation/moments"
import { generateVideo, isMp4 } from "@/lib/anne/animation/omni"
import { faceWithoutFrame, latestFace, readLiveState, runMoment, startMoment } from "@/lib/anne/animation/service"
import { addPolaroidFrame } from "@/lib/anne/generation/postprocess"

const NOW = new Date("2026-11-13T09:00:00Z")
const TODAY = "2026-11-13"
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from("ftypmp42"), Buffer.alloc(32)])

function db(over: Record<string, unknown[]> = {}, failOn?: (table: string, op: string) => boolean | Record<string, unknown>) {
  const store = createFakeSupabase(
    {
      app_generations: [
        { id: "g1", user_id: "u1", status: "generated", pregnancy_week: 22, storage_path: "u1/g1.png", created_at: "2026-11-12T20:00:00Z" },
        { id: "g0", user_id: "u1", status: "generated", pregnancy_week: 20, storage_path: null, created_at: "2026-11-12T21:00:00Z" },
        { id: "gx", user_id: "u2", status: "generated", pregnancy_week: 30, storage_path: "u2/gx.png", created_at: "2026-11-12T22:00:00Z" },
      ],
      app_moments: [],
      ...over,
    },
    failOn,
  )
  return store
}

/** Depo taklidi: resmi verir, yüklenen videoyu hatırlar. */
function withStorage(store: ReturnType<typeof db>, png: Buffer | null) {
  const uploaded: Record<string, Buffer> = {}
  const removed: string[] = []
  store.storage = {
    from: () => ({
      download: async () => (png ? { data: new Blob([new Uint8Array(png)]), error: null } : { data: null, error: { message: "yok" } }),
      upload: async (path: string, bytes: Buffer) => ((uploaded[path] = bytes), { error: null }),
      remove: async (paths: string[]) => (removed.push(...paths), { error: null }),
    }),
  }
  return { uploaded, removed }
}

describe("anlar ve günün sözleri", () => {
  it("anlar sırayla açılır; hepsi açılınca sıradaki kalmaz", () => {
    expect(nextMomentKind([])).toBe("gulumse")
    expect(nextMomentKind(["gulumse", "esne"])).toBe("kikirde")
    expect(nextMomentKind(MOMENTS.map((m) => m.kind))).toBeNull()
  })

  it("her yönerge kamerayı sabit, bebeği aynı ve gözleri kapalı tutar; konuşma istemez", () => {
    for (const moment of MOMENTS) {
      const prompt = momentPrompt(moment.kind)
      expect(prompt).toContain("camera is completely static")
      expect(prompt).toContain("identity stay exactly the same")
      expect(prompt).toContain("eyes closed")
      expect(prompt).toContain("no speech")
    }
    expect(new Set(MOMENTS.map((m) => momentPrompt(m.kind))).size).toBe(MOMENTS.length)
  })

  it("günün sözü aynı gün aynıdır, ertesi gün değişir; saate göre selam verir", () => {
    const input = { today: TODAY, hour: 9, weeks: 22, extraDays: 1, daysToDue: 125 }
    expect(dailyWords(input)).toEqual(dailyWords(input))
    expect(dailyWords(input)[1]).toBe("Bugün 22 hafta 1 günlüğüm.")
    expect(dailyWords({ ...input, extraDays: 0 })[1]).toBe("Bugün tam 22 haftalığım.")
    expect(dailyWords({ ...input, today: "2026-11-14" })[2]).not.toBe(dailyWords(input)[2])
    expect(dailyWords(input)[0]).toMatch(/Günaydın|Uyandın/)
    expect(dailyWords({ ...input, hour: 23 })[0]).toMatch(/gece|Uyku|rüya/i)
  })

  it("sözler gelişimle ilgili iddia içermez", () => {
    for (let day = 1; day <= 28; day++) {
      const text = dailyWords({ today: `2026-11-${String(day).padStart(2, "0")}`, hour: 14, weeks: 30, extraDays: 2, daysToDue: 60 }).join(" ")
      expect(text).not.toMatch(/duyuyorum|görüyorum|hissediyorum|kalbim|tekme/i)
    }
  })
})

describe("çerçevesiz yüz", () => {
  it("polaroid çerçeveyi tam olarak çıkarır", async () => {
    const inner = await sharp({ create: { width: 940, height: 1141, channels: 3, background: { r: 200, g: 120, b: 60 } } }).png().toBuffer()
    const framed = await addPolaroidFrame(inner, { withText: false })
    const result = await faceWithoutFrame(framed)
    expect([result.width, result.height]).toEqual([940, 1141])
    const meta = await sharp(result.jpeg).metadata()
    expect([meta.width, meta.height, meta.format]).toEqual([940, 1141, "jpeg"])
    // Çerçeveden hiç beyaz kalmamalı: köşe pikseli resmin rengidir.
    const { data } = await sharp(result.jpeg).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true })
    expect(data[0]).toBeGreaterThan(180)
    expect(data[2]).toBeLessThan(90)
  })
})

describe("durum ve başlatma", () => {
  it("yalnızca kendi, dosyası duran en son yüzü canlandırır", async () => {
    expect(await latestFace(db(), "u1")).toEqual({ id: "g1", week: 22, storagePath: "u1/g1.png" })
    expect(await latestFace(db(), "u3")).toBeNull()
    expect(await readLiveState(db(), "u3", TODAY, NOW)).toMatchObject({ face: null, canOpen: false })
  })

  it("günde bir an açılır; ertesi gün sıradaki açılır", async () => {
    const store = db()
    expect(await readLiveState(store, "u1", TODAY, NOW)).toMatchObject({ canOpen: true, next: "gulumse", total: 7 })
    const first = await startMoment(store, "u1", TODAY, NOW)
    expect(first).toMatchObject({ ok: true, kind: "gulumse", storagePath: "u1/g1.png" })
    expect(store.tables.app_moments[0]).toMatchObject({ user_id: "u1", generation_id: "g1", kind: "gulumse", status: "processing", day: TODAY })

    // Taklit veritabanı satıra gerçek saati yazar; sınamanın saatine çekilir.
    store.tables.app_moments[0].created_at = NOW.toISOString()
    expect(await startMoment(store, "u1", TODAY, NOW)).toMatchObject({ ok: false, status: 409 })
    store.tables.app_moments[0].status = "ready"
    expect(await readLiveState(store, "u1", TODAY, NOW)).toMatchObject({ canOpen: false, next: "esne" })
    expect(await startMoment(store, "u1", "2026-11-14", new Date("2026-11-14T09:00:00Z"))).toMatchObject({ ok: true, kind: "esne" })
  })

  it("yüzü olmayan hesap an açamaz; çift dokunuşu veritabanı kuralı durdurur", async () => {
    expect(await startMoment(db(), "u3", TODAY, NOW)).toMatchObject({ ok: false, status: 409 })
    const racing = db({}, (table, op) => (table === "app_moments" && op === "insert" ? { code: "23505" } : false))
    expect(await startMoment(racing, "u1", TODAY, NOW)).toMatchObject({ ok: false, status: 409 })
  })

  it("yarıda kalmış an silinir ve o gün yeniden denenebilir", async () => {
    const store = db({
      app_moments: [{ id: "m1", user_id: "u1", generation_id: "g1", kind: "gulumse", status: "processing", day: TODAY, created_at: "2026-11-13T08:50:00Z" }],
    })
    expect(await readLiveState(store, "u1", TODAY, NOW)).toMatchObject({ canOpen: true, next: "gulumse", moments: [] })
    expect(store.tables.app_moments).toHaveLength(0)
  })
})

describe("anın üretimi", () => {
  const moment = { id: "m1", userId: "u1", kind: "gulumse" as const, storagePath: "u1/g1.png" }
  const row = () => ({ id: "m1", user_id: "u1", generation_id: "g1", kind: "gulumse", status: "processing", day: TODAY, created_at: NOW.toISOString() })

  async function framedFace() {
    const inner = await sharp({ create: { width: 940, height: 1141, channels: 3, background: { r: 200, g: 120, b: 60 } } }).png().toBuffer()
    return addPolaroidFrame(inner, { withText: false })
  }

  it("çerçevesiz yüzü dikey video olarak üretir, depoya koyar ve hazır işaretler", async () => {
    const store = db({ app_moments: [row()] })
    const { uploaded } = withStorage(store, await framedFace())
    let seen: Record<string, unknown> = {}
    const ok = await runMoment(store, moment, {
      apiKey: "k",
      generate: async (request) => ((seen = request as unknown as Record<string, unknown>), MP4),
    })
    expect(ok).toBe(true)
    expect(seen).toMatchObject({ aspectRatio: "9:16", resolution: "720p", duration: "5s", prompt: momentPrompt("gulumse") })
    const sent = await sharp(seen.image as Buffer).metadata()
    expect([sent.width, sent.height]).toEqual([940, 1141])
    expect(uploaded["u1/m1.mp4"]).toEqual(MP4)
    expect(store.tables.app_moments[0]).toMatchObject({ status: "ready", storage_path: "u1/m1.mp4" })
  })

  it("model hata verirse ya da video döndürmezse satır silinir; günün hakkı yanmaz", async () => {
    for (const generate of [
      async () => {
        throw new Error("503 UNAVAILABLE")
      },
      async () => Buffer.from("<html>"),
    ]) {
      const store = db({ app_moments: [row()] })
      const { uploaded } = withStorage(store, await framedFace())
      expect(await runMoment(store, moment, { apiKey: "k", generate })).toBe(false)
      expect(store.tables.app_moments).toHaveLength(0)
      expect(Object.keys(uploaded)).toHaveLength(0)
      expect(await readLiveState(store, "u1", TODAY, NOW)).toMatchObject({ canOpen: true })
    }
  })

  it("anahtar ya da resim yoksa üretime gitmez", async () => {
    const store = db({ app_moments: [row()] })
    withStorage(store, null)
    let called = false
    const generate = async () => ((called = true), MP4)
    expect(await runMoment(store, moment, { apiKey: "k", generate })).toBe(false)
    const second = db({ app_moments: [row()] })
    withStorage(second, await framedFace())
    expect(await runMoment(second, moment, { apiKey: null, generate })).toBe(false)
    expect(called).toBe(false)
  })
})

describe("video modeli çağrısı", () => {
  const request = { apiKey: "k", image: Buffer.from([0xff, 0xd8, 0xff]), prompt: "p", aspectRatio: "9:16" as const, resolution: "720p", duration: "5s", timeoutMs: 1000 }

  it("görüntüyü ve yönergeyi doğru biçimde gönderir, yanıttaki videoyu çıkarır", async () => {
    let sent: { url: string; body: Record<string, unknown>; key: string | null } | null = null
    const fetchImpl = (async (url: string, init: RequestInit) => {
      sent = { url, body: JSON.parse(String(init.body)), key: new Headers(init.headers).get("x-goog-api-key") }
      return new Response(JSON.stringify({ status: "completed", steps: [{ type: "thought" }, { type: "model_output", content: [{ type: "video", mime_type: "video/mp4", data: MP4.toString("base64") }] }] }))
    }) as unknown as typeof fetch
    expect(await generateVideo({ ...request, fetchImpl })).toEqual(MP4)
    expect(sent!.url).toBe("https://generativelanguage.googleapis.com/v1beta/interactions")
    expect(sent!.key).toBe("k")
    expect(sent!.body).toMatchObject({
      model: "gemini-omni-1.2-flash",
      store: false,
      input: [{ type: "image", mime_type: "image/jpeg" }, { type: "text", text: "p" }],
      response_format: { type: "video", aspect_ratio: "9:16", resolution: "720p", duration: "5s" },
    })
  })

  it("hata yanıtını ve videosuz yanıtı hata olarak bildirir", async () => {
    const failing = (async () => new Response(JSON.stringify({ error: { status: "RESOURCE_EXHAUSTED", message: "quota" } }), { status: 429 })) as unknown as typeof fetch
    await expect(generateVideo({ ...request, fetchImpl: failing })).rejects.toThrow("429 RESOURCE_EXHAUSTED")
    const empty = (async () => new Response(JSON.stringify({ status: "blocked", steps: [] }))) as unknown as typeof fetch
    await expect(generateVideo({ ...request, fetchImpl: empty })).rejects.toThrow("video döndürmedi")
  })

  it("MP4 imzasını tanır", () => {
    expect(isMp4(MP4)).toBe(true)
    expect(isMp4(Buffer.from("<html><body>not a video</body></html>"))).toBe(false)
  })
})
