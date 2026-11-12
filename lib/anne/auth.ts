import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto"
import { normalizePhone } from "@/lib/phone"

// Hasta uygulamasının giriş mantığı: telefona SMS kodu, ardından sunucuda tutulan oturum.
// Personel girişinden (Supabase Auth) tamamen ayrıdır; hasta hesapları oraya eklenmez.
//
// Veritabanı bir parametre olarak alınır (servis rolü istemcisi). Böylece mantık,
// gerçek veritabanı olmadan sınanabilir.

export const CODE_TTL_MS = 5 * 60 * 1000
export const MAX_CODE_ATTEMPTS = 5
export const SESSION_TTL_MS = 60 * 24 * 60 * 60 * 1000
export const SESSION_COOKIE = "anne_oturum"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any

export type AppUser = {
  id: string
  phone: string
  display_name: string | null
  lmp_date: string | null
  due_date: string | null
  due_date_source: "lmp" | "due" | null
  onboarded_at: string | null
  clinic_approved_at: string | null
  created_at: string
}

const USER_COLUMNS =
  "id, phone, display_name, lmp_date, due_date, due_date_source, onboarded_at, clinic_approved_at, created_at"

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a, "hex")
  const y = Buffer.from(b, "hex")
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y)
}

export function hashToken(token: string): string {
  return sha256(token)
}

/** Giriş için kabul edilen tek biçim: TR cep telefonu. Değilse null. */
export function loginPhone(input: unknown): string | null {
  if (typeof input !== "string") return null
  const phone = normalizePhone(input)
  return /^05\d{9}$/.test(phone) ? phone : null
}

/**
 * Hukuki metinler hazır olana kadar uygulamaya yalnızca deneme numaraları girebilir
 * (ana plan, "Deneme kullanıcıları"). ANNE_ACIK=1 olmadıkça liste dışındaki numara giremez;
 * liste de boşsa kimse giremez.
 */
export function isPhoneAllowed(phone: string, env: Record<string, string | undefined> = process.env): boolean {
  if (env.ANNE_ACIK === "1") return true
  const allowed = (env.ANNE_DENEME_TELEFONLARI ?? "")
    .split(",")
    .map((p) => normalizePhone(p))
    .filter(Boolean)
  return allowed.includes(phone)
}

/** Her yeni hesabın ücretsiz bebek yüzü üretim hakkı (app_users.generation_allowance varsayılanı). */
export const FREE_GENERATIONS = 1

/**
 * Numaranın, silinen hesaplardan kalan kullanım kaydındaki anahtarı. Numara saklanmaz;
 * sunucu sırrıyla anahtarlanmış özeti saklanır, sır olmadan numaraya geri dönülemez.
 */
export function phoneUsageKey(phone: string, env: Record<string, string | undefined> = process.env): string {
  const secret = env.SUPABASE_JWT_SECRET || env.SUPABASE_SERVICE_ROLE_KEY || ""
  return createHmac("sha256", secret).update(`anne-uretim:${phone}`).digest("hex")
}

/** Bu numaranın daha önce silinmiş hesaplarında kullandığı üretim sayısı. */
async function usedBefore(db: Db, phone: string): Promise<number> {
  const { data } = await db.from("app_phone_usage").select("generations_used").eq("phone_key", phoneUsageKey(phone)).maybeSingle()
  return typeof data?.generations_used === "number" ? data.generations_used : 0
}

export type IssuedCode = { code: string }

/** Yeni kod üretir ve özetini kaydeder. Aynı numaranın önceki kullanılmamış kodları geçersiz kılınır. */
export async function issueLoginCode(db: Db, phone: string, now: Date = new Date()): Promise<IssuedCode | null> {
  const code = randomInt(100000, 1000000).toString()
  const salt = randomBytes(16).toString("hex")

  await db
    .from("app_login_codes")
    .update({ consumed_at: now.toISOString() })
    .eq("phone", phone)
    .is("consumed_at", null)

  const { error } = await db.from("app_login_codes").insert({
    phone,
    code_hash: sha256(`${salt}:${code}`),
    salt,
    attempts: 0,
    expires_at: new Date(now.getTime() + CODE_TTL_MS).toISOString(),
  })
  if (error) return null
  return { code }
}

export type CodeCheck = "ok" | "wrong" | "expired" | "too_many_attempts" | "error"

/**
 * Numaranın en son kodunu denetler. Doğruysa kod tüketilir (bir kez kullanılır).
 * Yanlış her deneme sayılır; sınır aşılınca doğru kod da kabul edilmez.
 */
export async function checkLoginCode(db: Db, phone: string, code: unknown, now: Date = new Date()): Promise<CodeCheck> {
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) return "wrong"

  const { data: row, error } = await db
    .from("app_login_codes")
    .select("id, code_hash, salt, attempts, expires_at, consumed_at")
    .eq("phone", phone)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return "error"
  if (!row) return "expired"
  if (new Date(row.expires_at).getTime() <= now.getTime()) return "expired"
  if (row.attempts >= MAX_CODE_ATTEMPTS) return "too_many_attempts"

  // Deneme, karşılaştırmadan ÖNCE sayılır: eşzamanlı istekler sınırı aşamasın diye
  // güncelleme "attempts hâlâ okuduğum değer" koşuluna bağlıdır.
  const { data: counted, error: countError } = await db
    .from("app_login_codes")
    .update({ attempts: row.attempts + 1 })
    .eq("id", row.id)
    .eq("attempts", row.attempts)
    .select("id")
  if (countError) return "error"
  if (!counted || counted.length === 0) return "too_many_attempts"

  if (!sameHash(sha256(`${row.salt}:${code}`), row.code_hash)) return "wrong"

  const { data: consumed, error: consumeError } = await db
    .from("app_login_codes")
    .update({ consumed_at: now.toISOString() })
    .eq("id", row.id)
    .is("consumed_at", null)
    .select("id")
  if (consumeError) return "error"
  // Aynı kod iki istekle aynı anda geldiyse yalnızca biri geçer.
  return consumed && consumed.length > 0 ? "ok" : "expired"
}

/** Numaranın hesabını bulur; yoksa oluşturur. */
export async function findOrCreateUser(db: Db, phone: string, now: Date = new Date()): Promise<AppUser | null> {
  const existing = await db.from("app_users").select(USER_COLUMNS).eq("phone", phone).maybeSingle()
  if (existing.error) return null

  if (existing.data) {
    await db.from("app_users").update({ last_login_at: now.toISOString() }).eq("id", existing.data.id)
    return existing.data
  }

  // Hesabını silip aynı numarayla yeniden açan kişi ücretsiz üretim hakkını yeniden kazanmaz.
  const carried = await usedBefore(db, phone)
  const created = await db
    .from("app_users")
    .insert({
      phone,
      last_login_at: now.toISOString(),
      ...(carried > 0 ? { generation_allowance: Math.max(0, FREE_GENERATIONS - carried) } : {}),
    })
    .select(USER_COLUMNS)
    .single()
  if (!created.error) return created.data

  // İki istek aynı anda hesap açmaya çalıştıysa (telefon tekildir) diğerinin açtığını kullan.
  const retry = await db.from("app_users").select(USER_COLUMNS).eq("phone", phone).maybeSingle()
  return retry.data ?? null
}

/** Oturum açar ve çereze konacak belirteci döndürür. Veritabanında yalnızca özeti durur. */
export async function createSession(
  db: Db,
  userId: string,
  userAgent: string | null,
  now: Date = new Date(),
): Promise<{ token: string; expiresAt: Date } | null> {
  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS)
  const { error } = await db.from("app_sessions").insert({
    user_id: userId,
    token_hash: hashToken(token),
    user_agent: userAgent ? userAgent.slice(0, 300) : null,
    last_seen_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  })
  return error ? null : { token, expiresAt }
}

/** Çerezdeki belirteçten hesabı bulur. Süresi dolmuş ya da bilinmeyen belirteç için null. */
export async function resolveSession(db: Db, token: string | undefined | null, now: Date = new Date()): Promise<AppUser | null> {
  if (!token || token.length < 20 || token.length > 200) return null

  const { data: session, error } = await db
    .from("app_sessions")
    .select("id, user_id, expires_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle()
  if (error || !session) return null
  if (new Date(session.expires_at).getTime() <= now.getTime()) return null

  const { data: user } = await db.from("app_users").select(USER_COLUMNS).eq("id", session.user_id).maybeSingle()
  return user ?? null
}

export async function destroySession(db: Db, token: string | undefined | null): Promise<void> {
  if (!token) return
  await db.from("app_sessions").delete().eq("token_hash", hashToken(token))
}

/** Hesabı ve ona bağlı her şeyi siler (oturumlar ve rızalar veritabanında zincirleme silinir). */
export async function deleteAccount(db: Db, user: Pick<AppUser, "id" | "phone">): Promise<boolean> {
  // Silinen hesaptan geriye kalan tek şey: numaranın anahtarlı özeti ve kullandığı üretim sayısı.
  const { data: generated } = await db.from("app_generations").select("id").eq("user_id", user.id).eq("status", "generated")
  const used = (generated ?? []).length
  if (used > 0) {
    const key = phoneUsageKey(user.phone)
    const previous = await usedBefore(db, user.phone)
    const row = { generations_used: previous + used, updated_at: new Date().toISOString() }
    const saved =
      previous > 0
        ? await db.from("app_phone_usage").update(row).eq("phone_key", key).select("phone_key")
        : await db.from("app_phone_usage").insert({ phone_key: key, ...row }).select("phone_key")
    // Kayıt yazılamadıysa hesap silinmez; yoksa hak sıfırlanmış olurdu.
    if (saved.error) return false
  }

  const { error } = await db.from("app_users").delete().eq("id", user.id)
  if (error) return false
  // Giriş kodları hesaba değil numaraya bağlıdır; onlar da gitsin.
  await db.from("app_login_codes").delete().eq("phone", user.phone)
  return true
}
