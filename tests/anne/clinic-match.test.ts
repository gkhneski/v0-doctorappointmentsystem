import { describe, it, expect } from "vitest"
import { createFakeSupabase } from "../helpers/fake-supabase"
import { applyClinicProfile, findClinicProfile, firstNameOf } from "@/lib/anne/clinic-match"
import type { AppUser } from "@/lib/anne/auth"

const PHONE = "05321234567"
const TODAY = "2026-11-12"
const now = new Date("2026-11-12T10:00:00Z")

function user(over: Partial<AppUser> = {}): AppUser {
  return {
    id: "u1",
    phone: PHONE,
    display_name: null,
    lmp_date: null,
    due_date: null,
    due_date_source: null,
    onboarded_at: null,
    clinic_approved_at: null,
    created_at: now.toISOString(),
    ...over,
  }
}

function db(patients: any[], episodes: any[], users: any[] = [user()]) {
  return createFakeSupabase({ patients, pregnancy_episodes: episodes, app_users: users })
}

const ayse = { id: "p1", full_name: "AYŞE NUR YILMAZ", phone: PHONE }
const episode = (over: any = {}) => ({
  id: "e1",
  patient_id: "p1",
  status: "active",
  sat_date: "2026-06-01",
  edd_date: null,
  ...over,
})

describe("firstNameOf", () => {
  it("ilk adı Türkçe kurallarıyla düzeltir", () => {
    expect(firstNameOf("AYŞE NUR YILMAZ")).toBe("Ayşe")
    expect(firstNameOf("  ışıl  demir")).toBe("Işıl")
    expect(firstNameOf("İREM KAYA")).toBe("İrem")
  })

  it("ad olmayan girdide null döner", () => {
    expect(firstNameOf("")).toBeNull()
    expect(firstNameOf("0532")).toBeNull()
    expect(firstNameOf(null)).toBeNull()
  })
})

describe("findClinicProfile", () => {
  it("kayıt yoksa null döner", async () => {
    expect(await findClinicProfile(db([], []), PHONE, TODAY)).toBeNull()
  })

  it("etkin gebeliği olan hastanın adını ve tarihini bulur", async () => {
    const found = await findClinicProfile(db([ayse], [episode()]), PHONE, TODAY)
    expect(found).toEqual({ displayName: "Ayşe", start: { lmp: "2026-06-01", dueDate: "2027-03-08", source: "lmp" } })
  })

  it("eski biçimde kayıtlı telefonu da bulur", async () => {
    const found = await findClinicProfile(db([{ ...ayse, phone: "5321234567" }], [episode()]), PHONE, TODAY)
    expect(found?.displayName).toBe("Ayşe")
  })

  it("doktorun girdiği tahmini doğum tarihi son adet tarihinden önceliklidir", async () => {
    const found = await findClinicProfile(db([ayse], [episode({ edd_date: "2027-03-15" })]), PHONE, TODAY)
    expect(found?.start).toEqual({ lmp: "2026-06-08", dueDate: "2027-03-15", source: "due" })
  })

  it("kapanmış gebelik tarih vermez; yalnızca ad döner", async () => {
    const found = await findClinicProfile(db([ayse], [episode({ status: "closed" })]), PHONE, TODAY)
    expect(found).toEqual({ displayName: "Ayşe", start: null })
  })

  it("44 haftadan eski (kapatılmamış) kayıttaki tarihi kullanmaz", async () => {
    const found = await findClinicProfile(db([ayse], [episode({ sat_date: "2025-01-01" })]), PHONE, TODAY)
    expect(found).toEqual({ displayName: "Ayşe", start: null })
  })

  it("numarayı paylaşan kayıtlardan yalnızca gebe olanı seçer", async () => {
    const mother = { id: "p2", full_name: "FATMA YILMAZ", phone: PHONE }
    const found = await findClinicProfile(db([mother, ayse], [episode()]), PHONE, TODAY)
    expect(found?.displayName).toBe("Ayşe")
  })

  it("numarayı paylaşan birden çok kayıtta kimin olduğu belli değilse null döner", async () => {
    const other = { id: "p2", full_name: "FATMA YILMAZ", phone: PHONE }
    expect(await findClinicProfile(db([ayse, other], []), PHONE, TODAY)).toBeNull()
    const two = [episode(), episode({ id: "e2", patient_id: "p2" })]
    expect(await findClinicProfile(db([ayse, other], two), PHONE, TODAY)).toBeNull()
  })

  it("başka numaranın kaydını döndürmez", async () => {
    expect(await findClinicProfile(db([{ ...ayse, phone: "05550000001" }], [episode()]), PHONE, TODAY)).toBeNull()
  })
})

describe("applyClinicProfile", () => {
  it("tanınan hastanın hesabını doldurur ve başlangıcı tamamlar", async () => {
    const store = db([ayse], [episode()])
    const result = await applyClinicProfile(store, user(), TODAY, now)
    expect(result.recognized).toBe(true)
    expect(result.user).toMatchObject({
      display_name: "Ayşe",
      lmp_date: "2026-06-01",
      due_date: "2027-03-08",
      due_date_source: "lmp",
      onboarded_at: now.toISOString(),
    })
    expect(store.tables.app_users[0]).toMatchObject({ display_name: "Ayşe", lmp_date: "2026-06-01" })
  })

  it("yalnızca ad bulunduysa adı yazar, başlangıç formu yine gösterilir", async () => {
    const store = db([ayse], [])
    const result = await applyClinicProfile(store, user(), TODAY, now)
    expect(result.recognized).toBe(false)
    expect(result.user.display_name).toBe("Ayşe")
    expect(result.user.onboarded_at).toBeNull()
  })

  it("başlangıcı tamamlamış hesaba dokunmaz", async () => {
    const done = user({ display_name: "Ayşecik", lmp_date: "2026-05-01", onboarded_at: now.toISOString() })
    const store = db([ayse], [episode()], [done])
    const result = await applyClinicProfile(store, done, TODAY, now)
    expect(result).toEqual({ user: done, recognized: false })
    expect(store.tables.app_users[0].lmp_date).toBe("2026-05-01")
  })

  it("klinik tablolarına hiçbir şey yazmaz", async () => {
    const store = db([ayse], [episode()])
    const before = JSON.stringify([store.tables.patients, store.tables.pregnancy_episodes])
    await applyClinicProfile(store, user(), TODAY, now)
    expect(JSON.stringify([store.tables.patients, store.tables.pregnancy_episodes])).toBe(before)
  })

  it("klinik kaydı okunamazsa hesap olduğu gibi kalır", async () => {
    const store = createFakeSupabase(
      { patients: [ayse], pregnancy_episodes: [episode()], app_users: [user()] },
      (table) => table === "pregnancy_episodes",
    )
    expect(await applyClinicProfile(store, user(), TODAY, now)).toEqual({ user: user(), recognized: false })
  })
})
