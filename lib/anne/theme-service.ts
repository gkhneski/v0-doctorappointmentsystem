import { isTheme, resolveTheme, type Theme } from "@/lib/anne/theme"

// Renk temasının veritabanı tarafı. Yalnızca app_ tablolarını kullanır.
// Veritabanı parametre olarak alınır; mantık gerçek veritabanı olmadan sınanabilir.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any

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
