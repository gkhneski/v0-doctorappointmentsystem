import { describe, it, expect, vi, beforeEach } from "vitest"

const { getAdminAuth } = vi.hoisted(() => ({ getAdminAuth: vi.fn() }))
vi.mock("@/lib/admin-auth", () => ({ getAdminAuth }))

import { requireAdmin } from "@/lib/require-admin"

beforeEach(() => {
  getAdminAuth.mockReset()
})

describe("requireAdmin", () => {
  it("oturum yoksa 401 ve 'Yetkisiz' döner", async () => {
    getAdminAuth.mockResolvedValue({ user: null, adminUser: null })
    const gate = await requireAdmin()
    expect(gate.ok).toBe(false)
    if (!gate.ok) {
      expect(gate.response.status).toBe(401)
      expect(await gate.response.json()).toEqual({ error: "Yetkisiz" })
    }
  })

  it("oturum var ama personel değilse 403 döner", async () => {
    getAdminAuth.mockResolvedValue({ user: { id: "u1" }, adminUser: null })
    const gate = await requireAdmin()
    expect(gate.ok).toBe(false)
    if (!gate.ok) {
      expect(gate.response.status).toBe(403)
      expect(await gate.response.json()).toEqual({ error: "Bu islem icin yetkiniz yok" })
    }
  })

  it("personelse kullanıcıyı ve rolü döner", async () => {
    getAdminAuth.mockResolvedValue({ user: { id: "u1" }, adminUser: { full_name: "A", role: "sekreter" } })
    const gate = await requireAdmin()
    expect(gate).toMatchObject({ ok: true, user: { id: "u1" }, adminUser: { role: "sekreter" } })
  })

  it("getAdminAuth hata fırlatırsa 401 döner (açık kalmaz)", async () => {
    getAdminAuth.mockImplementation(async () => {
      throw new Error("supabase down")
    })
    const gate = await requireAdmin()
    expect(gate.ok).toBe(false)
    if (!gate.ok) expect(gate.response.status).toBe(401)
  })

  it("rol istenirse ve rol uymuyorsa 403 döner", async () => {
    getAdminAuth.mockResolvedValue({ user: { id: "u1" }, adminUser: { full_name: "A", role: "sekreter" } })
    const gate = await requireAdmin({ role: "doktor" })
    expect(gate.ok).toBe(false)
    if (!gate.ok) {
      expect(gate.response.status).toBe(403)
      expect(await gate.response.json()).toEqual({ error: "Bu islem icin doktor yetkisi gerekir" })
    }
  })

  it("rol istenirse ve rol uyuyorsa geçer", async () => {
    getAdminAuth.mockResolvedValue({ user: { id: "u1" }, adminUser: { full_name: "A", role: "doktor" } })
    const gate = await requireAdmin({ role: "doktor" })
    expect(gate.ok).toBe(true)
  })
})
