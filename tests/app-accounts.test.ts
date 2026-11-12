import { describe, it, expect } from "vitest"
import { createFakeSupabase } from "./helpers/fake-supabase"
import { MAX_ALLOWANCE, changeAllowance, listAppAccounts } from "@/lib/app-accounts"

const now = new Date("2026-11-12T20:00:00Z")
const STAFF = "staff-1"

function db(allowance = 1, generations: any[] = []) {
  return createFakeSupabase({
    app_users: [
      { id: "u1", phone: "05321234567", display_name: "Ayşe", lmp_date: "2026-06-01", created_at: "2026-11-10T08:00:00Z", last_login_at: null, generation_allowance: allowance },
      { id: "u2", phone: "05550000002", display_name: null, lmp_date: null, created_at: "2026-11-11T08:00:00Z", last_login_at: null, generation_allowance: 1 },
    ],
    app_generations: generations,
  })
}

describe("uygulama hesapları", () => {
  it("her hesabın hakkını, kullanılanı ve kalanını kendi kayıtlarından hesaplar", async () => {
    const store = db(3, [
      { user_id: "u1", status: "generated" },
      { user_id: "u1", status: "processing" },
      { user_id: "u1", status: "failed" },
      { user_id: "u1", status: "draft" },
      { user_id: "u2", status: "generated" },
    ])
    const accounts = await listAppAccounts(store)
    expect(accounts.find((a) => a.id === "u1")).toMatchObject({ name: "Ayşe", allowance: 3, used: 2, remaining: 1, generated: 1, failed: 1 })
    expect(accounts.find((a) => a.id === "u2")).toMatchObject({ allowance: 1, used: 1, remaining: 0, generated: 1, failed: 0 })
  })
})

describe("üretim hakkı", () => {
  it("bir hak verir ve hak veren personeli hesaba yazar", async () => {
    const store = db(1)
    expect(await changeAllowance(store, "u1", 1, STAFF, now)).toEqual({ ok: true, allowance: 2 })
    expect(store.tables.app_users[0]).toMatchObject({ generation_allowance: 2, clinic_approved_by: STAFF, clinic_approved_at: now.toISOString() })
    expect(store.tables.app_users[1].generation_allowance).toBe(1)
  })

  it("kullanılmamış hakkı geri alır; kullanılmış olanı almaz", async () => {
    const store = db(2, [{ user_id: "u1", status: "generated" }])
    expect(await changeAllowance(store, "u1", -1, STAFF, now)).toEqual({ ok: true, allowance: 1 })
    expect(await changeAllowance(store, "u1", -1, STAFF, now)).toMatchObject({ ok: false, status: 400 })
    expect(store.tables.app_users[0].generation_allowance).toBe(1)
    expect(store.tables.app_users[0].clinic_approved_by).toBeUndefined()
  })

  it("üst sınırı aşmaz, yalnızca +1 ve -1 kabul eder, olmayan hesabı reddeder", async () => {
    const store = db(MAX_ALLOWANCE)
    expect(await changeAllowance(store, "u1", 1, STAFF, now)).toMatchObject({ ok: false, status: 400 })
    for (const bad of [5, 0, -2, 1.5, Number.NaN]) expect(await changeAllowance(store, "u2", bad, STAFF, now)).toMatchObject({ ok: false, status: 400 })
    expect(await changeAllowance(store, "yok", 1, STAFF, now)).toMatchObject({ ok: false, status: 404 })
  })
})
