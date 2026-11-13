import { ACCESSORIES, STARTERS, accessoryOf, isTheme, nextGift, resolveTheme, sanitizeLook, type LookItem, type Theme } from "@/lib/anne/look"

// Tema ve "Süsle"nin veritabanı tarafı. Yalnızca app_ tablolarını kullanır.
// Veritabanı parametre olarak alınır; mantık gerçek veritabanı olmadan sınanabilir.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any

export type LookState = {
  theme: Theme
  /** Annenin kendi seçtiği tema; seçmediyse null (cinsiyete göre). */
  themeChoice: Theme | null
  items: LookItem[]
  /** Açık aksesuarlar (başlangıçtakiler ve hediyeler). */
  unlocked: string[]
  /** Bugünün hediyesi açılabilir mi? */
  giftReady: boolean
  /** Daha açılacak hediye kaldı mı? */
  giftsLeft: number
  total: number
}

/** Üretilen son bebek yüzünde seçilmiş cinsiyet. */
async function babyGender(db: Db, userId: string): Promise<string | null> {
  const { data } = await db
    .from("app_generations")
    .select("gender, created_at")
    .eq("user_id", userId)
    .eq("status", "generated")
    .order("created_at", { ascending: false })
    .limit(1)
  return ((data ?? []) as { gender: string | null }[])[0]?.gender ?? null
}

/** Hesabın renk teması. Okunamazsa sade tema döner; ekran yine açılır. */
export async function themeFor(db: Db, user: { id: string; theme?: string | null }): Promise<Theme> {
  if (isTheme(user.theme)) return user.theme
  try {
    return resolveTheme(null, await babyGender(db, user.id))
  } catch {
    return "sade"
  }
}

/** Annenin tema seçimi; null "cinsiyete göre" demektir. */
export async function saveTheme(db: Db, userId: string, theme: Theme | null): Promise<boolean> {
  const { data, error } = await db.from("app_users").update({ theme }).eq("id", userId).select("id")
  return !error && Array.isArray(data) && data.length > 0
}

async function unlockedFor(db: Db, userId: string): Promise<{ unlocked: string[]; days: string[] }> {
  const { data } = await db.from("app_accessories").select("item, day").eq("user_id", userId).limit(200)
  const rows = ((data ?? []) as { item: string; day: string }[]).filter((row) => accessoryOf(row.item))
  return { unlocked: [...STARTERS, ...rows.map((row) => row.item).filter((id) => !STARTERS.includes(id))], days: rows.map((row) => row.day) }
}

export async function readLook(db: Db, user: { id: string; theme?: string | null }, today: string): Promise<LookState> {
  const theme = await themeFor(db, user)
  const { unlocked, days } = await unlockedFor(db, user.id)
  const { data: look } = await db.from("app_looks").select("items").eq("user_id", user.id).maybeSingle()
  const giftsLeft = ACCESSORIES.length - unlocked.length
  return {
    theme,
    themeChoice: isTheme(user.theme) ? user.theme : null,
    items: sanitizeLook(look?.items ?? [], unlocked) ?? [],
    unlocked,
    giftReady: giftsLeft > 0 && !days.includes(today),
    giftsLeft,
    total: ACCESSORIES.length,
  }
}

export type SaveLookResult = { ok: true; items: LookItem[] } | { ok: false; status: number; error: string }

/** Annenin yerleştirdiği aksesuarları kaydeder. Açılmamış aksesuar kaydedilmez. */
export async function saveLook(db: Db, userId: string, input: unknown, now: Date = new Date()): Promise<SaveLookResult> {
  const { unlocked } = await unlockedFor(db, userId)
  const items = sanitizeLook(input, unlocked)
  if (!items) return { ok: false, status: 400, error: "Geçersiz istek." }

  const failure: SaveLookResult = { ok: false, status: 500, error: "Kaydedilemedi. Lütfen yeniden dene." }
  const patch = { items, updated_at: now.toISOString() }
  const updated = await db.from("app_looks").update(patch).eq("user_id", userId).select("user_id")
  if (updated.error) return failure
  if ((updated.data ?? []).length > 0) return { ok: true, items }

  const inserted = await db.from("app_looks").insert({ user_id: userId, ...patch })
  if (!inserted.error) return { ok: true, items }
  // Aynı anda iki kayıt geldiyse satır az önce oluşmuştur; güncelleme yeniden denenir.
  if (inserted.error.code !== "23505") return failure
  const retried = await db.from("app_looks").update(patch).eq("user_id", userId).select("user_id")
  return retried.error || (retried.data ?? []).length === 0 ? failure : { ok: true, items }
}

export type GiftResult = { ok: true; item: string } | { ok: false; status: number; error: string }

/** Bugünün hediyesini açar: sıradaki aksesuar. Günde bir hediye; aynı aksesuar iki kez açılmaz. */
export async function openGift(db: Db, user: { id: string; theme?: string | null }, today: string): Promise<GiftResult> {
  const { unlocked, days } = await unlockedFor(db, user.id)
  if (days.includes(today)) return { ok: false, status: 409, error: "Bugünün hediyesini açtın. Yenisi yarın." }
  const item = nextGift(await themeFor(db, user), unlocked)
  if (!item) return { ok: false, status: 409, error: "Bütün aksesuarları topladın." }

  const { error } = await db.from("app_accessories").insert({ user_id: user.id, item, day: today })
  if (error) {
    return error.code === "23505"
      ? { ok: false, status: 409, error: "Bugünün hediyesini açtın. Yenisi yarın." }
      : { ok: false, status: 500, error: "Hediye açılamadı. Lütfen yeniden dene." }
  }
  return { ok: true, item }
}
