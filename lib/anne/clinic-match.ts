import { phoneVariants } from "@/lib/phone"
import { resolvePregnancyStart } from "@/lib/anne/pregnancy"
import type { AppUser } from "@/lib/anne/auth"

// Klinik kaydından tanıma: hasta uygulamasının klinik tablolarına açılan TEK kapısı.
//
// Kurallar (ana plan, 9c):
//   * Yalnızca OKUR; klinik tablolarına hiçbir şey yazmaz. tests/guards/anne-routes.test.ts
//     bu dosya dışında hiçbir hasta kodunun klinik tablosuna dokunmadığını denetler.
//   * Yalnızca SMS kodu doğrulandıktan SONRA çağrılır: numaranın sahibi olduğunu
//     kanıtlamayan kimseye klinik kaydından tek bir bilgi verilmez.
//   * Yalnızca ad ve gebelik tarihi alınır; hesaba kopyalanır. Sonrasında uygulama yine
//     yalnızca app_ tablolarıyla çalışır.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any

export type ClinicProfile = {
  /** Hitap için ilk ad ("AYŞE NUR YILMAZ" -> "Ayşe"). */
  displayName: string | null
  /** Etkin gebelik kaydındaki tarih; yoksa ya da kullanılamıyorsa null. */
  start: { lmp: string; dueDate: string; source: "lmp" | "due" } | null
}

/** Klinik kaydındaki tam addan hitap adı: ilk sözcük, Türkçe kurallarıyla baş harfi büyük. */
export function firstNameOf(fullName: unknown): string | null {
  if (typeof fullName !== "string") return null
  const first = fullName.trim().split(/\s+/)[0] ?? ""
  if (!first || !/\p{L}/u.test(first)) return null
  const lower = first.toLocaleLowerCase("tr")
  return (lower.charAt(0).toLocaleUpperCase("tr") + lower.slice(1)).slice(0, 60)
}

/**
 * Numaranın klinik kaydını bulur. Kimin kaydı olduğu kesin değilse null döner
 * (hasta bilgilerini kendisi girer):
 *   - Numara tek bir hastaya aitse o hasta.
 *   - Numarayı birden çok kayıt paylaşıyorsa (aile üyeleri) yalnızca içlerinden
 *     TEK biri etkin gebelikse o hasta.
 * Tarih olarak doktorun girdiği tahmini doğum tarihi önceliklidir, yoksa son adet tarihi.
 */
export async function findClinicProfile(db: Db, phone: string, today: string): Promise<ClinicProfile | null> {
  const variants = phoneVariants(phone)
  if (variants.length === 0) return null

  const { data: patients, error } = await db.from("patients").select("id, full_name").in("phone", variants).limit(10)
  if (error || !patients || patients.length === 0) return null

  const { data: episodes, error: episodeError } = await db
    .from("pregnancy_episodes")
    .select("patient_id, sat_date, edd_date")
    .in(
      "patient_id",
      patients.map((p: { id: string }) => p.id),
    )
    .eq("status", "active")
  if (episodeError) return null

  const active = episodes ?? []
  if (active.length > 1) return null

  const episode = active[0] ?? null
  const patient = episode ? patients.find((p: { id: string }) => p.id === episode.patient_id) : patients.length === 1 ? patients[0] : null
  if (!patient) return null

  let start: ClinicProfile["start"] = null
  if (episode) {
    const fromDue = episode.edd_date ? resolvePregnancyStart({ dueDate: episode.edd_date }, today) : null
    const fromLmp = episode.sat_date ? resolvePregnancyStart({ lmp: episode.sat_date }, today) : null
    const picked = fromDue?.ok ? fromDue : fromLmp?.ok ? fromLmp : null
    if (picked) start = { lmp: picked.lmp, dueDate: picked.dueDate, source: picked.source }
  }

  const displayName = firstNameOf(patient.full_name)
  return displayName || start ? { displayName, start } : null
}

/**
 * İlk girişte hesabı klinik kaydından doldurur. Tarih bulunduysa başlangıç formu atlanır;
 * yalnızca ad bulunduysa form adı dolu açılır. Başlangıcı tamamlamış hesaba dokunmaz:
 * hastanın sonradan kendi yaptığı düzeltme ezilmez.
 */
export async function applyClinicProfile(
  db: Db,
  user: AppUser,
  today: string,
  now: Date = new Date(),
): Promise<{ user: AppUser; recognized: boolean }> {
  if (user.onboarded_at) return { user, recognized: false }

  const profile = await findClinicProfile(db, user.phone, today)
  if (!profile) return { user, recognized: false }

  const changes: Partial<AppUser> = {}
  if (profile.displayName && !user.display_name) changes.display_name = profile.displayName
  if (profile.start) {
    changes.lmp_date = profile.start.lmp
    changes.due_date = profile.start.dueDate
    changes.due_date_source = profile.start.source
    changes.onboarded_at = now.toISOString()
  }
  if (Object.keys(changes).length === 0) return { user, recognized: false }

  const { data, error } = await db.from("app_users").update(changes).eq("id", user.id).select("id")
  if (error || !data || data.length === 0) return { user, recognized: false }

  return { user: { ...user, ...changes }, recognized: Boolean(profile.start) }
}
