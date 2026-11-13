import { describe, it, expect } from "vitest"
import { createFakeSupabase } from "./helpers/fake-supabase"
import { findDocumentForStaff, listDocumentsForAccount, listDocumentsForPatient, markDocumentSeen } from "@/lib/app-documents"
import { listAppAccounts } from "@/lib/app-accounts"
import { cleanTitle, isDocumentCategory, sniffDocument, toAppDocument } from "@/lib/anne/document-types"

const now = new Date("2026-11-13T09:00:00Z")

function db() {
  return createFakeSupabase({
    app_users: [
      { id: "u1", phone: "05321234567", display_name: "Ayşe", clinic_patient_id: "p1", generation_allowance: 1, created_at: "2026-11-10T08:00:00Z" },
      { id: "u2", phone: "05550000002", display_name: null, clinic_patient_id: null, generation_allowance: 1, created_at: "2026-11-11T08:00:00Z" },
    ],
    app_generations: [],
    app_documents: [
      { id: "d1", user_id: "u1", category: "kan_tahlili", title: "Hemogram", storage_path: "u1/a.jpg", mime: "image/jpeg", size_bytes: 1000, seen_at: null, created_at: "2026-11-12T08:00:00Z" },
      { id: "d2", user_id: "u1", category: "ultrason", title: null, storage_path: "u1/b.pdf", mime: "application/pdf", size_bytes: 2000, seen_at: "2026-11-12T10:00:00Z", created_at: "2026-11-12T09:00:00Z" },
      { id: "d3", user_id: "u2", category: "diger", title: null, storage_path: "u2/c.jpg", mime: "image/jpeg", size_bytes: 3000, seen_at: null, created_at: "2026-11-12T11:00:00Z" },
    ],
  })
}

describe("belge türü ve dosya denetimi", () => {
  it("dosya türünü ilk baytlarından anlar; başka dosyayı reddeder", () => {
    expect(sniffDocument(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg")
    expect(sniffDocument(new TextEncoder().encode("%PDF-1.7\n"))).toBe("application/pdf")
    expect(sniffDocument(new TextEncoder().encode("<html><script>"))).toBeNull()
    expect(sniffDocument(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBeNull()
    expect(sniffDocument(new Uint8Array([]))).toBeNull()
  })

  it("başlığı tek satıra indirir, işaretleri temizler, uzunluğu sınırlar", () => {
    expect(cleanTitle("  12 Kasım\n hemogram ")).toBe("12 Kasım hemogram")
    expect(cleanTitle("<b>x</b>")).toBe("b x /b")
    expect(cleanTitle("   ")).toBeNull()
    expect(cleanTitle(5)).toBeNull()
    expect(cleanTitle("a".repeat(200))).toHaveLength(80)
  })

  it("yalnızca bilinen türleri kabul eder; hastaya dosya yolunu göndermez", () => {
    expect(isDocumentCategory("kan_tahlili")).toBe(true)
    expect(isDocumentCategory("../x")).toBe(false)
    const doc = toAppDocument({ id: "d1", category: "kan_tahlili", title: "Hemogram", mime: "image/jpeg", seen_at: null, created_at: "2026-11-12T08:00:00Z", storage_path: "u1/a.jpg" })
    expect(doc).toEqual({ id: "d1", category: "kan_tahlili", title: "Hemogram", mime: "image/jpeg", createdAt: "2026-11-12T08:00:00Z", seen: false })
  })
})

describe("belgelerin klinik tarafı", () => {
  it("hasta kartında yalnızca o hastaya bağlı hesabın belgelerini listeler, en yenisi başta", async () => {
    const store = db()
    expect((await listDocumentsForPatient(store, "p1")).map((d) => d.id)).toEqual(["d2", "d1"])
    expect(await listDocumentsForPatient(store, "baska")).toEqual([])
    expect((await listDocumentsForAccount(store, "u2")).map((d) => d.id)).toEqual(["d3"])
  })

  it("belge ilk açıldığında görüldü işaretlenir; sonraki açılış tarihi değiştirmez", async () => {
    const store = db()
    expect(await findDocumentForStaff(store, "d1")).toEqual({ id: "d1", path: "u1/a.jpg", mime: "image/jpeg" })
    // Yalnızca bulmak işaretlemez: dosya verilemediyse hasta "gördü" yazısını görmemeli.
    expect(store.tables.app_documents[0].seen_at).toBeNull()
    await markDocumentSeen(store, "d1", now)
    expect(store.tables.app_documents[0].seen_at).toBe(now.toISOString())
    await markDocumentSeen(store, "d2", now)
    expect(store.tables.app_documents[1].seen_at).toBe("2026-11-12T10:00:00Z")
    expect(await findDocumentForStaff(store, "yok")).toBeNull()
  })

  it("hesap listesinde belge sayısını, yeni olanları ve hasta kartı bağlantısını verir", async () => {
    const accounts = await listAppAccounts(db())
    expect(accounts.find((a) => a.id === "u1")).toMatchObject({ documents: 2, unseenDocuments: 1, clinicPatientId: "p1" })
    expect(accounts.find((a) => a.id === "u2")).toMatchObject({ documents: 1, unseenDocuments: 1, clinicPatientId: null })
  })
})
