import { describe, it, expect, vi, beforeEach } from "vitest"
import { readFileSync } from "node:fs"

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))
vi.mock("@/lib/supabase/service-role", () => ({ createServiceRoleClient: () => ({ rpc }) }))

import { checkRateLimitDetailed } from "@/lib/rate-limit"
import { purgeStaleUnverified, releaseIfUnverified, staffEditStatus, SMS_FAILED_MESSAGE } from "@/lib/public-booking"
import { applyPendingPatient } from "@/lib/resolve-patient"
import { sanitizeChatMessages, MAX_ASSISTANT_TEXT, MAX_CHAT_CHARS } from "@/lib/ai-chat-guard"
import { createFakeSupabase } from "./helpers/fake-supabase"

beforeEach(() => {
  rpc.mockReset()
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("checkRateLimitDetailed (I2)", () => {
  it("sınır aşımı ile altyapı hatasını ayırır", async () => {
    rpc.mockResolvedValueOnce({ data: true, error: null })
    expect(await checkRateLimitDetailed("b", 1, 60)).toBe("allowed")
    rpc.mockResolvedValueOnce({ data: false, error: null })
    expect(await checkRateLimitDetailed("b", 1, 60)).toBe("limited")
    rpc.mockResolvedValueOnce({ data: null, error: { message: "down" } })
    expect(await checkRateLimitDetailed("b", 1, 60)).toBe("error")
    rpc.mockImplementationOnce(async () => {
      throw new Error("boom")
    })
    expect(await checkRateLimitDetailed("b", 1, 60)).toBe("error")
  })
})

describe("releaseIfUnverified (I1)", () => {
  it("yalnızca pending randevuyu siler", async () => {
    const db = createFakeSupabase({
      appointments: [
        { id: "a1", status: "pending" },
        { id: "a2", status: "scheduled" },
      ],
    })
    await releaseIfUnverified(db, "a1")
    await releaseIfUnverified(db, "a2")
    expect(db.tables.appointments.map((a: any) => a.id)).toEqual(["a2"])
  })
})

describe("purgeStaleUnverified (I5)", () => {
  it("yalnızca doğrulanmamış SMS kodu olan eski pending randevuyu siler", async () => {
    const now = new Date("2026-11-11T12:00:00Z")
    const old = new Date(now.getTime() - 16 * 60_000).toISOString()
    const db = createFakeSupabase({
      appointments: [
        { id: "public-unverified", status: "pending", created_at: old },
        { id: "no-sms-row", status: "pending", created_at: old },
        { id: "verified", status: "pending", created_at: old },
      ],
      sms_verifications: [
        { id: "s1", appointment_id: "public-unverified", verified: false },
        { id: "s2", appointment_id: "verified", verified: true },
      ],
    })
    await purgeStaleUnverified(db, now)
    expect(db.tables.appointments.map((a: any) => a.id)).toEqual(["no-sms-row", "verified"])
  })
})

describe("staffEditStatus (I4)", () => {
  it("personel pending randevuyu düzenlerse scheduled olur (silinmesin)", () => {
    expect(staffEditStatus("pending", undefined)).toBe("scheduled")
    expect(staffEditStatus("pending", "pending")).toBe("scheduled")
  })
  it("geçerli istenen durumu aynen uygular", () => {
    expect(staffEditStatus("pending", "cancelled")).toBe("cancelled")
    expect(staffEditStatus("scheduled", "confirmed")).toBe("confirmed")
  })
  it("durum istenmediyse ve pending değilse dokunmaz; pending ve bilinmeyen değer yazılamaz", () => {
    expect(staffEditStatus("scheduled", undefined)).toBeUndefined()
    expect(staffEditStatus("scheduled", "pending")).toBeUndefined()
    expect(staffEditStatus("confirmed", "hacked")).toBeUndefined()
  })
})

describe("applyPendingPatient (I6)", () => {
  it("hasta güncellemesi başarısızsa bekleyen değişikliği formda bırakır", async () => {
    const form = { id: "f1", appointment_id: "a1", form_data: { x: 1, _pending_patient: { full_name: "Yeni Ad" } } }
    const db = createFakeSupabase(
      {
        patients: [{ id: "p1", full_name: "Eski" }],
        appointments: [{ id: "a1", patient_id: "p1" }],
        appointment_forms: [form],
      },
      (table, op) => table === "patients" && op === "update",
    )
    await applyPendingPatient(db, "a1")
    expect(db.tables.appointment_forms[0].form_data).toHaveProperty("_pending_patient")
  })
})

describe("SMS hatası iletisi (I3)", () => {
  it("sekreter numarasını içerir", () => expect(SMS_FAILED_MESSAGE).toContain("0531 080 47 20"))
})

describe("sanitizeChatMessages (I7)", () => {
  const user = { id: "u", role: "user", parts: [{ type: "text", text: "selam" }] }

  it("asistan metnini sınırlar ve tanınmayan parçaları atar", () => {
    const out = sanitizeChatMessages([
      user,
      {
        id: "a",
        role: "assistant",
        parts: [
          { type: "text", text: "x".repeat(MAX_ASSISTANT_TEXT + 500) },
          { type: "tool-deleteEverything", output: {} },
          { type: "tool-getAvailableSlots", toolCallId: "t", state: "output-available", input: {}, output: {} },
          { type: "step-start" },
        ],
      },
    ])
    expect(out[1].parts.map((p: any) => p.type)).toEqual(["text", "tool-getAvailableSlots", "step-start"])
    expect((out[1].parts[0] as any).text).toHaveLength(MAX_ASSISTANT_TEXT)
  })

  it("çok büyük gövdeyi tümden reddeder", () => {
    const big = Array.from({ length: 30 }, (_, i) => ({
      id: `a${i}`,
      role: "assistant",
      parts: [{ type: "tool-getAvailableSlots", output: "y".repeat(MAX_CHAT_CHARS / 10) }],
    }))
    expect(sanitizeChatMessages([user, ...big])).toEqual([])
  })

  it("kırpmadan sonra ilk ileti kullanıcıya aittir", () => {
    const msgs = Array.from({ length: 41 }, (_, i) => ({
      id: `m${i}`,
      role: i % 2 === 0 ? "user" : "assistant",
      parts: [{ type: "text", text: "a" }],
    }))
    expect(sanitizeChatMessages(msgs)[0].role).toBe("user")
  })
})

describe("yol bağlantıları (I1, I2, I3, I4, I6)", () => {
  const booking = readFileSync("app/api/appointments/route.ts", "utf8")
  const verify = readFileSync("app/api/appointments/verify/route.ts", "utf8")
  const patch = readFileSync("app/api/appointments/[appointmentId]/route.ts", "utf8")

  it("telefon sınırı ön kontrollerden sonra, hasta kaydından önce sayılır", () => {
    const phone = booking.indexOf("appt:phone:")
    expect(phone).toBeGreaterThan(booking.indexOf("if (blacklistedPatient)"))
    expect(phone).toBeLessThan(booking.indexOf("await resolvePatient("))
  })

  it("bekleyen değişikliği taşıyan form yazılamazsa randevu geri alınır", () => {
    expect(booking).toMatch(/formError && patient\.pending/)
  })

  it("doğrulama yolu altyapı hatasında kodu yakmaz, kilitlenmede saati boşaltır", () => {
    expect(verify).toContain("checkRateLimitDetailed(")
    expect(verify).toContain("releaseIfUnverified(")
    expect(verify).toContain("status: 503")
    expect(verify).not.toContain("failClosed")
  })

  it("personel düzenlemesi durumu staffEditStatus ile belirler", () => {
    expect(patch).toContain("staffEditStatus(")
    expect(patch).not.toContain("if (status) updateData.status = status")
  })
})
