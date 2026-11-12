import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createFakeSupabase } from "../../helpers/fake-supabase"
import { analyzeBiometrics, generateAiParameters } from "@/lib/anne/generation/biometrics"
import { PRIMARY_MODEL, enhanceUltrasoundScientific, type EnhanceResult } from "@/lib/anne/generation/enhance"
import { parseOcrResponse } from "@/lib/anne/generation/ocr"
import { fullGeminiPrompt, fullReplicatePrompt } from "@/lib/anne/generation/prompt"
import {
  GENERIC_FAILURE,
  MAX_PAPERS,
  STALE_PROCESSING_MS,
  addPaperToDraft,
  readAllowance,
  readState,
  resetDraft,
  runGeneration,
  startGeneration,
} from "@/lib/anne/generation/service"
import { parseValidationResponse } from "@/lib/anne/generation/validator"

const USER = "u1"
const OTHER = "u2"
const now = new Date("2026-11-12T10:00:00Z")
const image = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])
const framedInput = readFileSync(join("tests", "anne", "generation", "fixtures", "frame-kucuk-input.png"))

function freshDb(allowance = 1) {
  const files = new Map<string, Buffer>()
  const db = createFakeSupabase({
    app_users: [
      { id: USER, generation_allowance: allowance },
      { id: OTHER, generation_allowance: 1 },
    ],
    app_generations: [],
  })
  db.storage = {
    from: () => ({
      upload: async (path: string, body: Buffer) => (files.set(path, body), { error: null }),
      remove: async (paths: string[]) => (paths.forEach((p) => files.delete(p)), { error: null }),
    }),
  }
  return { db, files }
}

const success = async (): Promise<EnhanceResult> => ({
  success: true,
  image: Buffer.from("png"),
  promptUsed: "yönerge",
  model: PRIMARY_MODEL,
  provider: "gemini",
})
const failure = async (): Promise<EnhanceResult> => ({ success: false, error: "REPLICATE_API_TOKEN not configured" })

describe("ölçüm kâğıdı", () => {
  it("okunan değerleri taslağa işler ve yalnızca sayıları döndürür", async () => {
    const { db } = freshDb()
    const first = await addPaperToDraft(db, USER, { bpd: 63.7, hc: 235.1, eye: 9.6, humerus: 40 })
    expect(first).toEqual({ ok: true, filled: 3, draft: { papers: 1, measurements: 3 } })
    const second = await addPaperToDraft(db, USER, { bpd: 64, chin: 6.8 })
    expect(second).toEqual({ ok: true, filled: 2, draft: { papers: 2, measurements: 4 } })
    expect(db.tables.app_generations).toHaveLength(1)
    expect(db.tables.app_generations[0].biometrics).toEqual({ bpd: 64, hc: 235.1, eye_diameter: 9.6, chin: 6.8 })
  })

  it("kâğıt sayısı sınırlıdır; sıfırlama ölçümleri siler", async () => {
    const { db } = freshDb()
    for (let i = 0; i < MAX_PAPERS; i++) expect((await addPaperToDraft(db, USER, { bpd: 60 + i })).ok).toBe(true)
    expect(await addPaperToDraft(db, USER, { bpd: 70 })).toEqual({ ok: false, reason: "limit" })
    await resetDraft(db, USER)
    expect(db.tables.app_generations[0]).toMatchObject({ biometrics: {}, papers_read: 0 })
  })

  it("okuma yanıtını çözer: kod çiti atılır, hiç ölçüm yoksa başarısız sayılır", () => {
    expect(parseOcrResponse('```json\n{"success": true, "bpd": 63.7, "hc": null}\n```')).toMatchObject({ success: true, found_count: 1, bpd: 63.7 })
    expect(parseOcrResponse('{"success": true, "bpd": null}')).toEqual({
      success: false,
      found_count: 0,
      error: "Görüntüde ölçüm değeri bulunamadı",
    })
    expect(parseOcrResponse("okuyamadım").success).toBe(false)
  })
})

describe("görüntü denetimi", () => {
  it("ultrason + bebek yüzü + kalite 30 ve üstü ise geçerlidir", () => {
    const answer = (extra: object) => JSON.stringify({ is_ultrasound: true, has_fetal_face: true, quality_score: 30, gestational_weeks: "21", ...extra })
    expect(parseValidationResponse(`Yanıt: ${answer({})}`)).toMatchObject({ is_valid: true, gestational_weeks: 21 })
    expect(parseValidationResponse(answer({ quality_score: 29 })).is_valid).toBe(false)
    expect(parseValidationResponse(answer({ has_fetal_face: false })).is_valid).toBe(false)
    expect(parseValidationResponse(answer({ is_ultrasound: false })).is_valid).toBe(false)
    expect(parseValidationResponse("anlaşılmadı")).toEqual({ is_valid: false, error: "AI yanıtı parse edilemedi" })
  })
})

describe("üretimi başlatma", () => {
  it("18. haftadan önce başlatılamaz", async () => {
    const { db } = freshDb()
    const result = await startGeneration(db, USER, { week: 17, gender: "female" }, now)
    expect(result).toMatchObject({ ok: false, status: 400 })
    expect(db.tables.app_generations).toHaveLength(0)
  })

  it("kâğıt okunmadan da başlar; taslak üretiliyor durumuna geçer", async () => {
    const { db } = freshDb()
    const result = await startGeneration(db, USER, { week: 24, gender: "male" }, now)
    expect(result.ok).toBe(true)
    expect(db.tables.app_generations[0]).toMatchObject({ status: "processing", pregnancy_week: 24, gender: "male", user_id: USER })
  })

  it("aynı anda ikinci üretim başlatılamaz", async () => {
    const { db } = freshDb(5)
    expect((await startGeneration(db, USER, { week: 24, gender: "male" }, now)).ok).toBe(true)
    expect(await startGeneration(db, USER, { week: 24, gender: "male" }, now)).toMatchObject({ ok: false, status: 409 })
  })

  it("hak kalmadıysa başlatılamaz; başkasının üretimi hakkı etkilemez", async () => {
    const { db } = freshDb(1)
    db.tables.app_generations.push({ id: "g0", user_id: OTHER, status: "generated", storage_path: "x" })
    const first = await startGeneration(db, USER, { week: 24, gender: "female" }, now)
    expect(first.ok).toBe(true)
    if (first.ok) await runGeneration(db, first.row, image, {}, { enhance: success })
    expect(await readAllowance(db, USER)).toEqual({ total: 1, used: 1, remaining: 0, processing: false })
    expect(await startGeneration(db, USER, { week: 24, gender: "female" }, now)).toMatchObject({ ok: false, status: 402 })
    expect((await readAllowance(db, OTHER)).remaining).toBe(0)
  })
})

describe("üretim sonucu", () => {
  it("başarıda resim depoya yazılır ve hak düşer", async () => {
    const { db, files } = freshDb()
    await addPaperToDraft(db, USER, { bpd: 63.7 })
    const started = await startGeneration(db, USER, { week: 26, gender: "female" }, now)
    if (!started.ok) throw new Error("başlamadı")
    expect(started.biometrics).toEqual({ bpd: 63.7 })

    expect(await runGeneration(db, started.row, image, started.biometrics, { enhance: success })).toBe("generated")
    const row = db.tables.app_generations[0]
    expect(row).toMatchObject({ status: "generated", model: PRIMARY_MODEL, provider: "gemini", prompt_used: "yönerge" })
    expect(row.storage_path).toBe(`${USER}/${row.id}.png`)
    expect(files.has(row.storage_path)).toBe(true)
    expect((await readAllowance(db, USER)).remaining).toBe(0)
  })

  it("başarısızlıkta hak düşmez, ölçümler yeni taslağa taşınır, ham hata hastaya gösterilmez", async () => {
    const { db, files } = freshDb()
    await addPaperToDraft(db, USER, { bpd: 63.7, hc: 235.1 })
    const started = await startGeneration(db, USER, { week: 26, gender: "female" }, now)
    if (!started.ok) throw new Error("başlamadı")

    expect(await runGeneration(db, started.row, image, started.biometrics, { enhance: failure })).toBe("failed")
    expect(files.size).toBe(0)
    expect((await readAllowance(db, USER)).remaining).toBe(1)

    const state = await readState(db, USER)
    expect(state.draft).toEqual({ papers: 1, measurements: 2 })
    expect(state.items).toHaveLength(1)
    expect(state.items[0]).toMatchObject({ status: "failed", error: GENERIC_FAILURE })
    expect(JSON.stringify(state)).not.toContain("REPLICATE")
  })

  it("üretim sırasında hata fırlasa da kayıt başarısız olarak kapanır", async () => {
    const { db } = freshDb()
    const started = await startGeneration(db, USER, { week: 26, gender: "male" }, now)
    if (!started.ok) throw new Error("başlamadı")
    const boom = async (): Promise<EnhanceResult> => {
      throw new Error("beklenmeyen")
    }
    expect(await runGeneration(db, started.row, image, {}, { enhance: boom })).toBe("failed")
    expect(db.tables.app_generations.find((r: any) => r.id === started.row.id).status).toBe("failed")
  })

  it("son duruma geçen kayıt bir daha değişmez", async () => {
    const { db } = freshDb(3)
    const started = await startGeneration(db, USER, { week: 26, gender: "male" }, now)
    if (!started.ok) throw new Error("başlamadı")
    await runGeneration(db, started.row, image, {}, { enhance: failure })
    expect(await runGeneration(db, started.row, image, {}, { enhance: success })).toBe("failed")
    expect(db.tables.app_generations.find((r: any) => r.id === started.row.id).status).toBe("failed")
  })

  it("yarıda kalan üretim süre dolunca başarısız sayılır ve hak geri gelir", async () => {
    const { db } = freshDb()
    expect((await startGeneration(db, USER, { week: 26, gender: "male" }, now)).ok).toBe(true)
    const soon = await readState(db, USER, new Date(now.getTime() + STALE_PROCESSING_MS - 1000))
    expect(soon.allowance).toMatchObject({ remaining: 0, processing: true })
    const late = await readState(db, USER, new Date(now.getTime() + STALE_PROCESSING_MS + 1000))
    expect(late.allowance).toMatchObject({ remaining: 1, processing: false })
    expect(late.items[0].status).toBe("failed")
  })

  it("durum yalnızca kendi hesabının kayıtlarını içerir", async () => {
    const { db } = freshDb()
    db.tables.app_generations.push({ id: "g0", user_id: OTHER, status: "generated", storage_path: "x", created_at: now.toISOString() })
    expect((await readState(db, USER)).items).toEqual([])
  })
})

// ---- Sağlayıcı çağrıları (ağ taklit edilir) ----

const params = generateAiParameters(analyzeBiometrics({ bpd: 63.7, hc: 235.1 }), 26, "female")
const noWait = async () => undefined

function geminiImageResponse() {
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text: "tamam" }, { inlineData: { mimeType: "image/png", data: framedInput.toString("base64") } }] } }] }),
    { status: 200 },
  )
}
const geminiError = (status: number, code: string) => new Response(JSON.stringify({ error: { status: code, message: "x" } }), { status })

describe("sağlayıcı sırası", () => {
  it("Google'a eski sistemdeki istek gider: önce görüntü, sonra sistem mesajı + yönerge", async () => {
    const calls: { url: string; body: any }[] = []
    const fetchImpl = (async (url: string, init: RequestInit) => {
      calls.push({ url: String(url), body: JSON.parse(String(init.body)) })
      return geminiImageResponse()
    }) as unknown as typeof fetch

    const result = await enhanceUltrasoundScientific(image, params, { fetchImpl, wait: noWait, env: { GEMINI_API_KEY: "k" }, patientName: "Ayşe" })
    expect(result).toMatchObject({ success: true, provider: "gemini", model: "gemini-3-pro-image-preview" })
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toContain("/models/gemini-3-pro-image-preview:generateContent")
    const parts = calls[0].body.contents[0].parts
    expect(parts[0].inlineData).toEqual({ mimeType: "image/jpeg", data: image.toString("base64") })
    expect(parts[1].text).toBe(fullGeminiPrompt(params))
    expect(calls[0].body.generationConfig).toEqual({ responseModalities: ["image", "text"] })
  })

  it("yoğunlukta 3 kez dener (3, 6, 9 saniye bekleyerek), sonra yedeğe geçer", async () => {
    const waits: number[] = []
    let geminiCalls = 0
    const fetchImpl = (async (url: string) => {
      if (String(url).includes("generativelanguage")) {
        geminiCalls++
        return geminiError(503, "UNAVAILABLE")
      }
      throw new Error("yedeğe gidilmemeliydi")
    }) as unknown as typeof fetch

    const result = await enhanceUltrasoundScientific(image, params, {
      fetchImpl,
      wait: async (ms) => void waits.push(ms),
      env: { GEMINI_API_KEY: "k" },
    })
    expect(geminiCalls).toBe(3)
    expect(waits).toEqual([3000, 6000, 9000])
    expect(result).toEqual({ success: false, error: "REPLICATE_API_TOKEN not configured" })
  })

  it("geçici olmayan hatada beklemeden yedeğe geçer; yedek aynı yönergeyi alır", async () => {
    const seen: { url: string; body?: any }[] = []
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      const u = String(url)
      if (u.includes("generativelanguage")) return geminiError(400, "INVALID_ARGUMENT")
      if (u.endsWith("/files")) return new Response(JSON.stringify({ urls: { get: "https://replicate.test/file" } }), { status: 201 })
      if (u.endsWith("/models/google/nano-banana/predictions")) {
        seen.push({ url: u, body: JSON.parse(String(init?.body)) })
        return new Response(JSON.stringify({ status: "succeeded", output: "https://replicate.test/out.png", urls: { get: "https://replicate.test/p" } }), { status: 201 })
      }
      if (u === "https://replicate.test/out.png") return new Response(new Uint8Array(framedInput), { status: 200 })
      throw new Error(`beklenmeyen adres: ${u}`)
    }) as unknown as typeof fetch

    const waits: number[] = []
    const result = await enhanceUltrasoundScientific(image, params, {
      fetchImpl,
      wait: async (ms) => void waits.push(ms),
      env: { GEMINI_API_KEY: "k", REPLICATE_API_TOKEN: "t" },
    })
    expect(waits).toEqual([])
    expect(result).toMatchObject({ success: true, provider: "replicate_fallback", model: "google/nano-banana" })
    expect(seen[0].body.input).toEqual({ prompt: fullReplicatePrompt(params), image_input: ["https://replicate.test/file"], output_format: "png" })
  })

  it("Google görüntü döndürmezse yedeğe geçer", async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "üretemedim" }] } }] }), { status: 200 })) as unknown as typeof fetch
    const result = await enhanceUltrasoundScientific(image, params, { fetchImpl, wait: noWait, env: { GEMINI_API_KEY: "k" } })
    expect(result).toEqual({ success: false, error: "REPLICATE_API_TOKEN not configured" })
  })

  it("Google anahtarı yoksa hiçbir çağrı yapılmaz", async () => {
    const fetchImpl = (async () => {
      throw new Error("çağrı yapılmamalıydı")
    }) as unknown as typeof fetch
    expect(await enhanceUltrasoundScientific(image, params, { fetchImpl, env: {} })).toEqual({ success: false, error: "GEMINI_API_KEY not configured" })
  })
})
