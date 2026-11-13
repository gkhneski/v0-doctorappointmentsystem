import sharp from "sharp"
import { GENERATION_BUCKET } from "@/lib/anne/generation/limits"
import { geminiApiKey } from "@/lib/anne/generation/gemini"
import { MOMENTS, MOMENT_BUCKET, MOMENT_DURATION, MOMENT_RESOLUTION, isMomentKind, momentPrompt, nextMomentKind, type MomentKind } from "@/lib/anne/animation/moments"
import { OMNI_MODEL, generateVideo, isMp4 } from "@/lib/anne/animation/omni"

// "Canlı bebeğim": üretilmiş bebek yüzünden günde bir yeni an (kısa video) açar.
// Yalnızca app_ tablolarını kullanır. Veritabanı parametre olarak alınır; mantık gerçek
// veritabanı ve gerçek video modeli olmadan sınanabilir.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any

export { MOMENT_BUCKET }
/** Bu süreden uzun "üretiliyor" kalan an yarıda kalmış sayılır ve silinir (günün hakkı yanmaz). */
export const STALE_MOMENT_MS = 4 * 60 * 1000
export const MOMENT_FAILURE = "Bugünün anı hazırlanamadı. Biraz sonra yeniden dene."

export type PublicMoment = { id: string; kind: MomentKind; status: "processing" | "ready"; day: string }

export type LiveState = {
  /** Canlandırılan yüz resmi; hiç resim üretilmemişse null. */
  face: { id: string; week: number | null } | null
  moments: PublicMoment[]
  /** Bugün yeni bir an açılabilir mi? */
  canOpen: boolean
  /** Sıradaki an; hepsi açıldıysa null. */
  next: MomentKind | null
  total: number
}

type MomentRow = { id: string; kind: string; status: string; day: string; created_at: string; storage_path: string | null }

/** Hesabın en son üretilmiş (ve dosyası duran) bebek yüzü. */
export async function latestFace(db: Db, userId: string): Promise<{ id: string; week: number | null; storagePath: string } | null> {
  const { data } = await db
    .from("app_generations")
    .select("id, pregnancy_week, storage_path, created_at")
    .eq("user_id", userId)
    .eq("status", "generated")
    .order("created_at", { ascending: false })
    .limit(5)
  const row = ((data ?? []) as { id: string; pregnancy_week: number | null; storage_path: string | null }[]).find((r) => r.storage_path)
  return row ? { id: row.id, week: row.pregnancy_week, storagePath: row.storage_path as string } : null
}

/** Yarıda kalmış anları siler; böylece hasta o gün yeniden deneyebilir. */
async function expireStale(db: Db, userId: string, now: Date): Promise<void> {
  const cutoff = new Date(now.getTime() - STALE_MOMENT_MS).toISOString()
  await db.from("app_moments").delete().eq("user_id", userId).eq("status", "processing").lt("created_at", cutoff)
}

export async function readLiveState(db: Db, userId: string, today: string, now: Date = new Date()): Promise<LiveState> {
  const face = await latestFace(db, userId)
  if (!face) return { face: null, moments: [], canOpen: false, next: null, total: MOMENTS.length }

  await expireStale(db, userId, now)
  const { data } = await db
    .from("app_moments")
    .select("id, kind, status, day, created_at, storage_path")
    .eq("user_id", userId)
    .eq("generation_id", face.id)
    .order("created_at")
    .limit(50)
  const rows = ((data ?? []) as MomentRow[]).filter((row) => isMomentKind(row.kind))
  const moments: PublicMoment[] = rows.map((row) => ({
    id: row.id,
    kind: row.kind as MomentKind,
    status: row.status === "ready" ? "ready" : "processing",
    day: row.day,
  }))

  // Günde bir an: başka bir yüz için bugün açılmış an da bugünün hakkını kullanmıştır.
  const { data: todays } = await db.from("app_moments").select("id").eq("user_id", userId).eq("day", today).limit(1)
  const next = nextMomentKind(moments.map((m) => m.kind))
  return {
    face: { id: face.id, week: face.week },
    moments,
    canOpen: next !== null && (todays ?? []).length === 0,
    next,
    total: MOMENTS.length,
  }
}

export type StartResult = { ok: true; id: string; kind: MomentKind; storagePath: string } | { ok: false; status: number; error: string }

/**
 * Bugünün anını başlatır: satırı "üretiliyor" olarak yazar. Günde bir an ve yüz başına her
 * andan bir tane kuralını veritabanındaki tekillik kuralları korur (çift dokunuş, iki sekme).
 */
export async function startMoment(db: Db, userId: string, today: string, now: Date = new Date()): Promise<StartResult> {
  const state = await readLiveState(db, userId, today, now)
  const face = state.face ? await latestFace(db, userId) : null
  if (!state.face || !face) return { ok: false, status: 409, error: "Önce bebeğinin yüzünü üretmelisin." }
  if (!state.next) return { ok: false, status: 409, error: "Bütün anları açtın." }
  if (!state.canOpen) return { ok: false, status: 409, error: "Bugünün anını açtın. Yenisi yarın." }

  const { data, error } = await db
    .from("app_moments")
    .insert({ user_id: userId, generation_id: face.id, kind: state.next, status: "processing", day: today, model: OMNI_MODEL })
    .select("id")
    .single()
  if (error || !data) {
    if (error?.code === "23505") return { ok: false, status: 409, error: "Bugünün anı zaten hazırlanıyor." }
    return { ok: false, status: 500, error: MOMENT_FAILURE }
  }
  return { ok: true, id: data.id, kind: state.next, storagePath: face.storagePath }
}

/**
 * Saklanan resimden polaroid çerçeveyi çıkarır; geriye üretilen yüzün kendisi kalır.
 * Çerçeve ölçüleri lib/anne/generation/postprocess.ts (addPolaroidFrame) ile aynıdır:
 * yan = trunc(g × 0,045), üst = trunc(y × 0,045), alt = trunc(y × 0,13) ve dört yanda
 * gölge payı = max(6, trunc(g × 0,008)).
 */
export async function faceWithoutFrame(png: Buffer): Promise<{ jpeg: Buffer; width: number; height: number }> {
  const meta = await sharp(png).metadata()
  const solve = (total: number, framed: (inner: number) => number): number | null => {
    for (let inner = Math.floor(total * 0.7); inner <= total; inner++) if (framed(inner) === total) return inner
    return null
  }
  const shadowOf = (w: number) => Math.max(6, Math.trunc(w * 0.008))
  const width = solve(meta.width ?? 0, (w) => w + Math.trunc(w * 0.045) * 2 + shadowOf(w) * 2)
  const shadow = width ? shadowOf(width) : 0
  const height = width ? solve(meta.height ?? 0, (h) => h + Math.trunc(h * 0.045) + Math.trunc(h * 0.13) + shadow * 2) : null
  // Çerçeve çözülemezse (beklenmeyen ölçü) resim olduğu gibi kullanılır.
  const pipeline =
    width && height
      ? sharp(png).extract({ left: shadow + Math.trunc(width * 0.045), top: shadow + Math.trunc(height * 0.045), width, height })
      : sharp(png)
  const jpeg = await pipeline.jpeg({ quality: 92 }).toBuffer()
  return { jpeg, width: width ?? meta.width ?? 0, height: height ?? meta.height ?? 0 }
}

export type RunDeps = {
  apiKey?: string | null
  generate?: typeof generateVideo
  /** Sunucunun süresi dolmadan bitmesi için son an (ms). */
  deadlineAt?: number
}

/**
 * Anı üretir: resmi depodan alır, çerçeveyi çıkarır, videoyu üretir, depoya koyar ve satırı
 * "hazır" yapar. Herhangi bir adım başarısız olursa satır silinir; günün hakkı yanmaz.
 */
export async function runMoment(db: Db, moment: { id: string; userId: string; kind: MomentKind; storagePath: string }, deps: RunDeps = {}): Promise<boolean> {
  const fail = async (detail: unknown) => {
    console.error("Moment failed:", moment.kind, detail instanceof Error ? detail.message : detail)
    await db.from("app_moments").delete().eq("id", moment.id).eq("status", "processing")
    return false
  }

  try {
    const apiKey = deps.apiKey === undefined ? geminiApiKey() : deps.apiKey
    if (!apiKey) return await fail("anahtar yok")

    const { data: file, error } = await db.storage.from(GENERATION_BUCKET).download(moment.storagePath)
    if (error || !file) return await fail(error?.message ?? "resim yok")
    const face = await faceWithoutFrame(Buffer.from(await file.arrayBuffer()))

    const remaining = deps.deadlineAt ? deps.deadlineAt - Date.now() : 240_000
    if (remaining < 30_000) return await fail("süre yetmiyor")

    const video = await (deps.generate ?? generateVideo)({
      apiKey,
      image: face.jpeg,
      prompt: momentPrompt(moment.kind),
      aspectRatio: face.height >= face.width ? "9:16" : "16:9",
      resolution: MOMENT_RESOLUTION,
      duration: MOMENT_DURATION,
      timeoutMs: Math.min(240_000, remaining - 10_000),
    })
    if (!isMp4(video)) return await fail("video değil")

    const path = `${moment.userId}/${moment.id}.mp4`
    const upload = await db.storage.from(MOMENT_BUCKET).upload(path, video, { contentType: "video/mp4", upsert: true })
    if (upload.error) return await fail(upload.error.message)

    const { data: saved, error: saveError } = await db
      .from("app_moments")
      .update({ status: "ready", storage_path: path, completed_at: new Date().toISOString() })
      .eq("id", moment.id)
      .eq("status", "processing")
      .select("id")
    if (saveError || !saved || saved.length === 0) {
      // Satır bu arada silindiyse (yarıda kaldı sayıldı) dosya sahipsiz kalmasın.
      await db.storage.from(MOMENT_BUCKET).remove([path])
      return false
    }
    return true
  } catch (error) {
    return await fail(error)
  }
}
