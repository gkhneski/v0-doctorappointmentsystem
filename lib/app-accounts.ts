// Hasta uygulaması hesaplarının klinik tarafı: liste ve bebek yüzü üretim hakkı.
// Yalnızca app_ tablolarını kullanır; klinik hasta kaydına bağlanmaz. Personel yolları
// (app/api/admin/uygulama, app/admin/uygulama) çağırır; yetki denetimi onlardadır.
//
// Veritabanı parametre olarak alınır (servis rolü istemcisi); mantık gerçek veritabanı
// olmadan sınanabilir.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any

export const MAX_ALLOWANCE = 50

export type AppAccount = {
  id: string
  phone: string
  name: string | null
  lmp: string | null
  createdAt: string
  lastLoginAt: string | null
  /** Toplam hak, kullanılan (başarılı + süren) ve kalan. */
  allowance: number
  used: number
  remaining: number
  generated: number
  failed: number
}

export async function listAppAccounts(db: Db): Promise<AppAccount[]> {
  const [{ data: users }, { data: generations }] = await Promise.all([
    db
      .from("app_users")
      .select("id, phone, display_name, lmp_date, created_at, last_login_at, generation_allowance")
      .order("created_at", { ascending: false })
      .limit(500),
    db.from("app_generations").select("user_id, status").in("status", ["generated", "processing", "failed"]).limit(5000),
  ])

  const counts = new Map<string, { generated: number; processing: number; failed: number }>()
  for (const row of (generations ?? []) as { user_id: string; status: "generated" | "processing" | "failed" }[]) {
    const entry = counts.get(row.user_id) ?? { generated: 0, processing: 0, failed: 0 }
    entry[row.status]++
    counts.set(row.user_id, entry)
  }

  return ((users ?? []) as Record<string, unknown>[]).map((u) => {
    const c = counts.get(u.id as string) ?? { generated: 0, processing: 0, failed: 0 }
    const allowance = typeof u.generation_allowance === "number" ? u.generation_allowance : 0
    const used = c.generated + c.processing
    return {
      id: u.id as string,
      phone: u.phone as string,
      name: (u.display_name as string | null) ?? null,
      lmp: (u.lmp_date as string | null) ?? null,
      createdAt: u.created_at as string,
      lastLoginAt: (u.last_login_at as string | null) ?? null,
      allowance,
      used,
      remaining: Math.max(0, allowance - used),
      generated: c.generated,
      failed: c.failed,
    }
  })
}

export type AllowanceChange = { ok: true; allowance: number } | { ok: false; status: number; error: string }

/**
 * Bir hesabın üretim hakkını artırır ya da azaltır. Hak, kullanılmış olanın altına ve
 * üst sınırın üstüne çekilemez. Hak veren personel hesaba "onaylayan" olarak yazılır.
 */
export async function changeAllowance(db: Db, accountId: string, delta: number, staffId: string, now: Date = new Date()): Promise<AllowanceChange> {
  if (delta !== 1 && delta !== -1) return { ok: false, status: 400, error: "Geçersiz istek." }

  const { data: account } = await db.from("app_users").select("id, generation_allowance").eq("id", accountId).maybeSingle()
  if (!account) return { ok: false, status: 404, error: "Hesap bulunamadı." }

  const { data: usedRows } = await db.from("app_generations").select("status").eq("user_id", accountId).in("status", ["generated", "processing"])
  const used = (usedRows ?? []).length
  const current = typeof account.generation_allowance === "number" ? account.generation_allowance : 0
  const next = current + delta
  if (next > MAX_ALLOWANCE) return { ok: false, status: 400, error: `Bir hesaba en çok ${MAX_ALLOWANCE} hak verilebilir.` }
  if (next < used || next < 0) return { ok: false, status: 400, error: "Kullanılmış hak geri alınamaz." }

  // Eşzamanlı iki tıklama hakkı iki kez değiştirmesin: güncelleme okunan değere bağlıdır.
  const changes: Record<string, unknown> = { generation_allowance: next }
  if (delta > 0) {
    changes.clinic_approved_at = now.toISOString()
    changes.clinic_approved_by = staffId
  }
  const { data, error } = await db.from("app_users").update(changes).eq("id", accountId).eq("generation_allowance", current).select("id")
  if (error) return { ok: false, status: 500, error: "Kaydedilemedi. Lütfen yeniden deneyin." }
  if (!data || data.length === 0) return { ok: false, status: 409, error: "Hak az önce değişti. Sayfayı yenileyip yeniden deneyin." }
  return { ok: true, allowance: next }
}
