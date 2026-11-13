// Hastaların uygulamadan yüklediği belgelerin klinik tarafı: liste ve dosyayı açma.
// Yalnızca app_ tablolarını kullanır. Personel yolu (app/api/admin/uygulama/belgeler) çağırır;
// yetki denetimi oradadır. Veritabanı parametre olarak alınır; mantık gerçek veritabanı
// olmadan sınanabilir.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any

export type StaffDocument = {
  id: string
  accountId: string
  category: string
  title: string | null
  mime: string
  sizeBytes: number
  createdAt: string
  seenAt: string | null
}

const COLUMNS = "id, user_id, category, title, mime, size_bytes, seen_at, created_at"

function toStaffDocument(row: Record<string, unknown>): StaffDocument {
  return {
    id: String(row.id),
    accountId: String(row.user_id),
    category: String(row.category),
    title: typeof row.title === "string" && row.title ? row.title : null,
    mime: String(row.mime),
    sizeBytes: typeof row.size_bytes === "number" ? row.size_bytes : 0,
    createdAt: String(row.created_at),
    seenAt: typeof row.seen_at === "string" ? row.seen_at : null,
  }
}

/** Bir uygulama hesabının belgeleri, en yenisi başta. */
export async function listDocumentsForAccount(db: Db, accountId: string): Promise<StaffDocument[]> {
  const { data } = await db.from("app_documents").select(COLUMNS).eq("user_id", accountId).order("created_at", { ascending: false }).limit(200)
  return ((data ?? []) as Record<string, unknown>[]).map(toStaffDocument)
}

/**
 * Bir klinik hastasının uygulamadan yüklediği belgeler. Hasta kaydı, uygulama hesabına
 * randevu alırken ya da numara eşleşmesiyle bağlanır (app_users.clinic_patient_id).
 */
export async function listDocumentsForPatient(db: Db, patientId: string): Promise<StaffDocument[]> {
  const { data: accounts } = await db.from("app_users").select("id").eq("clinic_patient_id", patientId).limit(5)
  const ids = ((accounts ?? []) as { id: string }[]).map((a) => a.id)
  if (ids.length === 0) return []
  const { data } = await db.from("app_documents").select(COLUMNS).in("user_id", ids).order("created_at", { ascending: false }).limit(200)
  return ((data ?? []) as Record<string, unknown>[]).map(toStaffDocument)
}

/** Personelin açacağı dosyanın yeri. */
export async function findDocumentForStaff(db: Db, documentId: string): Promise<{ id: string; path: string; mime: string } | null> {
  const { data: row } = await db.from("app_documents").select("id, storage_path, mime").eq("id", documentId).maybeSingle()
  return row ? { id: row.id, path: row.storage_path, mime: row.mime } : null
}

/**
 * Dosya personele gerçekten verildikten sonra çağrılır: ilk açılışta "görüldü" işaretlenir;
 * hasta kendi ekranında kliniğin belgeyi gördüğünü görür. Sonraki açılışlar tarihi değiştirmez.
 */
export async function markDocumentSeen(db: Db, documentId: string, now: Date = new Date()): Promise<void> {
  await db.from("app_documents").update({ seen_at: now.toISOString() }).eq("id", documentId).is("seen_at", null)
}
