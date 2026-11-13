// Hastanın yükleyebildiği belge türleri ve sınırlar. Yalnızca düz veri ve saf işlevler:
// hem sunucu hem tarayıcı, hem de personel ekranı kullanır.

export const DOCUMENT_CATEGORIES = [
  { id: "kan_tahlili", label: "Kan tahlili", tone: "pink" },
  { id: "idrar_tahlili", label: "İdrar tahlili", tone: "peach" },
  { id: "ultrason", label: "Ultrason raporu", tone: "lilac" },
  { id: "tarama_testi", label: "Tarama testi", tone: "pink" },
  { id: "rapor", label: "Rapor / epikriz", tone: "peach" },
  { id: "recete", label: "Reçete / ilaç", tone: "lilac" },
  { id: "diger", label: "Diğer", tone: "plain" },
] as const

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number]["id"]

export function isDocumentCategory(value: unknown): value is DocumentCategory {
  return typeof value === "string" && DOCUMENT_CATEGORIES.some((c) => c.id === value)
}

export function documentCategoryLabel(id: string | null | undefined): string {
  return DOCUMENT_CATEGORIES.find((c) => c.id === id)?.label ?? "Belge"
}

/** Belgelerin durduğu, herkese kapalı depo. */
export const DOCUMENT_BUCKET = "anne-belge"

/** Sunucu yolundan geçen dosyanın üst sınırı (barındırma istek gövdesini 4,5 MB ile sınırlar). */
export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024
export const MAX_DOCUMENTS = 60
export const MAX_TITLE_LENGTH = 80

export type DocumentMime = "image/jpeg" | "application/pdf"

/** Dosyanın türü adından ya da beyanından değil, ilk baytlarından anlaşılır. */
export function sniffDocument(bytes: Uint8Array): DocumentMime | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg"
  // "%PDF-"
  if (bytes.length > 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d) {
    return "application/pdf"
  }
  return null
}

/** Başlık: tek satır, denetim karakteri yok, en çok 80 karakter; boşsa null. */
export function cleanTitle(value: unknown): string | null {
  if (typeof value !== "string") return null
  const title = value
    .normalize("NFC")
    .replace(/[\p{Cc}<>]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, MAX_TITLE_LENGTH)
  return title || null
}

export type AppDocument = {
  id: string
  category: DocumentCategory
  title: string | null
  mime: DocumentMime
  createdAt: string
  /** Klinik belgeyi açtıysa true. */
  seen: boolean
}

export function toAppDocument(row: Record<string, unknown>): AppDocument {
  return {
    id: String(row.id),
    category: isDocumentCategory(row.category) ? row.category : "diger",
    title: typeof row.title === "string" && row.title ? row.title : null,
    mime: row.mime === "application/pdf" ? "application/pdf" : "image/jpeg",
    createdAt: String(row.created_at),
    seen: Boolean(row.seen_at),
  }
}

export const DOCUMENT_COLUMNS = "id, category, title, mime, seen_at, created_at"
