import { describe, it, expect } from "vitest"
import { initialStatus, smsOutcome, purgeStaleUnverified, isUuid } from "@/lib/public-booking"
import { createFakeSupabase } from "./helpers/fake-supabase"

describe("initialStatus", () => {
  it("personelin açtığı randevu bugünkü gibi scheduled doğar", () => expect(initialStatus(true)).toBe("scheduled"))
  it("herkese açık randevu doğrulanana kadar pending kalır", () => expect(initialStatus(false)).toBe("pending"))
})

describe("smsOutcome", () => {
  it("personel + SMS gitti: devam, kod dönmez", () => expect(smsOutcome(true, true, "123456")).toEqual({ action: "continue" }))
  it("personel + SMS gitmedi: devam, kod ekranda gösterilmek üzere döner", () =>
    expect(smsOutcome(true, false, "123456")).toEqual({ action: "continue", devCode: "123456" }))
  it("herkese açık + SMS gitti: devam, kod dönmez", () =>
    expect(smsOutcome(false, true, "123456")).toEqual({ action: "continue" }))
  it("herkese açık + SMS gitmedi: randevu geri alınır, kod asla dönmez", () =>
    expect(smsOutcome(false, false, "123456")).toEqual({ action: "rollback" }))
})

describe("purgeStaleUnverified", () => {
  it("yalnızca 15 dakikayı geçmiş pending randevuları siler", async () => {
    const now = new Date("2026-11-11T12:00:00Z")
    const at = (min: number) => new Date(now.getTime() - min * 60_000).toISOString()
    const db = createFakeSupabase({
      appointments: [
        { id: "old-pending", status: "pending", created_at: at(16) },
        { id: "new-pending", status: "pending", created_at: at(5) },
        { id: "old-scheduled", status: "scheduled", created_at: at(16) },
        { id: "old-confirmed", status: "confirmed", created_at: at(600) },
      ],
    })
    await purgeStaleUnverified(db, now)
    expect(db.tables.appointments.map((a: any) => a.id)).toEqual(["new-pending", "old-scheduled", "old-confirmed"])
  })

  it("veritabanı hatasında fırlatmaz", async () => {
    const broken = { from: () => { throw new Error("down") } } as any
    await expect(purgeStaleUnverified(broken)).resolves.toBeUndefined()
  })
})

describe("isUuid", () => {
  it.each(["3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e"])("kabul eder: %s", (v) => expect(isUuid(v)).toBe(true))
  it.each(["", "abc", "3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e:x", null, undefined, 5, {}])("reddeder: %s", (v) =>
    expect(isUuid(v)).toBe(false),
  )
})
