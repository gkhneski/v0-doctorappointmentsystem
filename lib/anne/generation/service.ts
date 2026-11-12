import {
  analyzeBiometrics,
  generateAiParameters,
  mergeOcrResult,
  readBiometrics,
  type Biometrics,
  type Gender,
} from "@/lib/anne/generation/biometrics"
import { GENERATION_BUCKET, MIN_GENERATION_WEEK } from "@/lib/anne/generation/limits"
import { enhanceUltrasoundScientific, type EnhanceOptions, type EnhanceResult } from "@/lib/anne/generation/enhance"

// Bebek yüzü üretiminin kayıt tarafı: taslak, hak, başlatma, sonuç.
// Eski sistemden korunan kurallar: başlat -> durum -> sonuç akışı, durum geçişleri
// (processing -> generated | failed; ikisi de son durumdur), hakkın yalnızca başarılı
// üretimde düşmesi, 18. hafta alt sınırı.
//
// Veritabanı parametre olarak alınır (servis rolü istemcisi); mantık gerçek veritabanı
// olmadan sınanabilir.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any

export { GENERATION_BUCKET, MIN_GENERATION_WEEK }
export const MAX_PAPERS = 6
/** Bu süreden uzun "üretiliyor" görünen kayıt yarıda kalmış sayılır. */
export const STALE_PROCESSING_MS = 6 * 60 * 1000

export type GenerationRow = {
  id: string
  user_id: string
  status: "draft" | "processing" | "generated" | "failed"
  biometrics: unknown
  papers_read: number
  pregnancy_week: number | null
  gender: Gender | null
  storage_path: string | null
  error: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

const COLUMNS = "id, user_id, status, biometrics, papers_read, pregnancy_week, gender, storage_path, error, created_at, started_at, completed_at"

export const GENERIC_FAILURE = "Resim şu anda üretilemedi. Hakkın düşmedi; biraz sonra yeniden deneyebilirsin."

export async function findDraft(db: Db, userId: string): Promise<GenerationRow | null> {
  const { data } = await db.from("app_generations").select(COLUMNS).eq("user_id", userId).eq("status", "draft").limit(1).maybeSingle()
  return data ?? null
}

async function getOrCreateDraft(db: Db, userId: string): Promise<GenerationRow | null> {
  const existing = await findDraft(db, userId)
  if (existing) return existing
  const created = await db.from("app_generations").insert({ user_id: userId, status: "draft", biometrics: {}, papers_read: 0 }).select(COLUMNS).single()
  if (!created.error && created.data) return created.data
  // İki istek aynı anda taslak açmaya çalıştıysa diğerinin açtığını kullan.
  return findDraft(db, userId)
}

export type DraftSummary = { papers: number; measurements: number }

export function summarizeDraft(draft: GenerationRow | null): DraftSummary {
  if (!draft) return { papers: 0, measurements: 0 }
  return { papers: draft.papers_read, measurements: Object.keys(readBiometrics(draft.biometrics)).length }
}

/** Okunan bir ölçüm kâğıdını taslağa işler. Değerler hastaya gösterilmez; yalnızca sayıları döner. */
export async function addPaperToDraft(
  db: Db,
  userId: string,
  ocr: Record<string, unknown>,
): Promise<{ ok: true; filled: number; draft: DraftSummary } | { ok: false; reason: "limit" | "error" }> {
  const draft = await getOrCreateDraft(db, userId)
  if (!draft) return { ok: false, reason: "error" }
  if (draft.papers_read >= MAX_PAPERS) return { ok: false, reason: "limit" }

  const merged = mergeOcrResult(readBiometrics(draft.biometrics), ocr)
  const biometrics = readBiometrics(merged.biometrics)
  const { data, error } = await db
    .from("app_generations")
    .update({ biometrics, papers_read: draft.papers_read + 1 })
    .eq("id", draft.id)
    .eq("user_id", userId)
    .eq("status", "draft")
    .select(COLUMNS)
  if (error || !data || data.length === 0) return { ok: false, reason: "error" }
  return { ok: true, filled: merged.filled, draft: summarizeDraft(data[0]) }
}

export async function resetDraft(db: Db, userId: string): Promise<void> {
  await db.from("app_generations").update({ biometrics: {}, papers_read: 0 }).eq("user_id", userId).eq("status", "draft")
}

/** Yarıda kalmış üretimleri başarısız sayar; böylece hak geri gelir ve yeni üretim başlatılabilir. */
export async function expireStale(db: Db, userId: string, now: Date = new Date()): Promise<void> {
  const cutoff = new Date(now.getTime() - STALE_PROCESSING_MS).toISOString()
  await db
    .from("app_generations")
    .update({ status: "failed", error: GENERIC_FAILURE, error_detail: "stale: no result within limit", completed_at: now.toISOString() })
    .eq("user_id", userId)
    .eq("status", "processing")
    .lt("started_at", cutoff)
}

export type Allowance = { total: number; used: number; remaining: number; processing: boolean }

export async function readAllowance(db: Db, userId: string): Promise<Allowance> {
  const [{ data: account }, { data: rows }] = await Promise.all([
    db.from("app_users").select("generation_allowance").eq("id", userId).maybeSingle(),
    db.from("app_generations").select("status").eq("user_id", userId).in("status", ["generated", "processing"]),
  ])
  const total = typeof account?.generation_allowance === "number" ? account.generation_allowance : 0
  const list: { status: string }[] = rows ?? []
  const processing = list.some((r) => r.status === "processing")
  const used = list.length
  return { total, used, remaining: Math.max(0, total - used), processing }
}

export type StartCheck =
  | { ok: true; row: GenerationRow; biometrics: Biometrics }
  | { ok: false; status: number; error: string }

/** Üretim başlatılabilir mi? Başlatılabiliyorsa taslağı "üretiliyor" durumuna geçirir. */
export async function startGeneration(
  db: Db,
  userId: string,
  input: { week: number; gender: Gender },
  now: Date = new Date(),
): Promise<StartCheck> {
  if (!Number.isInteger(input.week) || input.week < MIN_GENERATION_WEEK) {
    return { ok: false, status: 400, error: `Bebeğin yüzü ${MIN_GENERATION_WEEK}. haftadan itibaren üretilebiliyor.` }
  }
  if (input.week > 44) return { ok: false, status: 400, error: "Gebelik haftan güncel görünmüyor. Hesap ekranından düzeltebilirsin." }

  await expireStale(db, userId, now)
  const allowance = await readAllowance(db, userId)
  if (allowance.processing) return { ok: false, status: 409, error: "Bir resim şu anda üretiliyor. Bitmesini bekle." }
  if (allowance.remaining < 1) return { ok: false, status: 402, error: "Üretim hakkın kalmadı." }

  const draft = await getOrCreateDraft(db, userId)
  if (!draft) return { ok: false, status: 500, error: GENERIC_FAILURE }

  const { data, error } = await db
    .from("app_generations")
    .update({ status: "processing", pregnancy_week: input.week, gender: input.gender, started_at: now.toISOString(), error: null })
    .eq("id", draft.id)
    .eq("user_id", userId)
    .eq("status", "draft")
    .select(COLUMNS)
  if (error || !data || data.length === 0) {
    return { ok: false, status: 409, error: "Bir resim şu anda üretiliyor. Bitmesini bekle." }
  }
  return { ok: true, row: data[0], biometrics: readBiometrics(draft.biometrics) }
}

async function finalize(db: Db, row: Pick<GenerationRow, "id" | "user_id">, changes: Record<string, unknown>): Promise<boolean> {
  // Yalnızca processing -> generated | failed; son durumdaki kayıt bir daha değişmez.
  const { data } = await db
    .from("app_generations")
    .update({ ...changes, completed_at: new Date().toISOString() })
    .eq("id", row.id)
    .eq("user_id", row.user_id)
    .eq("status", "processing")
    .select("id")
  return Boolean(data && data.length > 0)
}

export async function failGeneration(db: Db, row: Pick<GenerationRow, "id" | "user_id">, detail: string): Promise<void> {
  const failed = await finalize(db, row, { status: "failed", error: GENERIC_FAILURE, error_detail: detail.slice(0, 1000) })
  if (!failed) return

  // Okunan ölçümler kaybolmasın: hasta kâğıtları yeniden çekmeden tekrar deneyebilsin.
  const { data: old } = await db.from("app_generations").select("biometrics, papers_read").eq("id", row.id).eq("user_id", row.user_id).maybeSingle()
  if (!old || (await findDraft(db, row.user_id))) return
  await db
    .from("app_generations")
    .insert({ user_id: row.user_id, status: "draft", biometrics: readBiometrics(old.biometrics), papers_read: old.papers_read ?? 0 })
}

/**
 * Üretimi çalıştırır ve sonucu kaydeder. Hata fırlatmaz: her durumda kayıt son duruma geçer.
 * Hastanın yüklediği görüntü yalnızca bellekte tutulur; depoya üretilen resim yazılır.
 */
export async function runGeneration(
  db: Db,
  row: GenerationRow,
  image: Buffer,
  biometrics: Biometrics,
  options: EnhanceOptions & { enhance?: (image: Buffer, params: ReturnType<typeof generateAiParameters>, options: EnhanceOptions) => Promise<EnhanceResult> } = {},
): Promise<"generated" | "failed"> {
  try {
    if (!row.pregnancy_week || !row.gender) throw new Error("hafta ya da cinsiyet eksik")
    const params = generateAiParameters(analyzeBiometrics(biometrics), row.pregnancy_week, row.gender)
    const result = await (options.enhance ?? enhanceUltrasoundScientific)(image, params, options)
    if (!result.success) {
      await failGeneration(db, row, result.error)
      return "failed"
    }

    const path = `${row.user_id}/${row.id}.png`
    const upload = await db.storage.from(GENERATION_BUCKET).upload(path, result.image, { contentType: "image/png", upsert: true })
    if (upload.error) {
      await failGeneration(db, row, `depo: ${upload.error.message}`)
      return "failed"
    }

    const saved = await finalize(db, row, {
      status: "generated",
      storage_path: path,
      model: result.model,
      provider: result.provider,
      prompt_used: result.promptUsed,
    })
    if (!saved) {
      // Kayıt bu arada "yarıda kaldı" sayıldıysa dosya sahipsiz kalmasın.
      await db.storage.from(GENERATION_BUCKET).remove([path])
      return "failed"
    }
    return "generated"
  } catch (error) {
    await failGeneration(db, row, error instanceof Error ? error.message : String(error))
    return "failed"
  }
}

export type PublicGeneration = { id: string; status: "processing" | "generated" | "failed"; week: number | null; createdAt: string; error: string | null }

export async function listGenerations(db: Db, userId: string): Promise<PublicGeneration[]> {
  const { data } = await db
    .from("app_generations")
    .select(COLUMNS)
    .eq("user_id", userId)
    .in("status", ["processing", "generated", "failed"])
    .order("created_at", { ascending: false })
    .limit(30)
  return ((data ?? []) as GenerationRow[])
    // Resmi silinmiş başarılı üretim listede görünmez (kaydı hak hesabı için durur).
    .filter((row) => row.status !== "generated" || row.storage_path)
    .map((row) => ({
    id: row.id,
    status: row.status as PublicGeneration["status"],
    week: row.pregnancy_week,
    createdAt: row.created_at,
    error: row.status === "failed" ? (row.error ?? GENERIC_FAILURE) : null,
  }))
}

export type GenerationState = {
  minWeek: number
  allowance: Allowance
  draft: DraftSummary
  items: PublicGeneration[]
}

export async function readState(db: Db, userId: string, now: Date = new Date()): Promise<GenerationState> {
  await expireStale(db, userId, now)
  const [allowance, draft, items] = await Promise.all([readAllowance(db, userId), findDraft(db, userId), listGenerations(db, userId)])
  return { minWeek: MIN_GENERATION_WEEK, allowance, draft: summarizeDraft(draft), items }
}
