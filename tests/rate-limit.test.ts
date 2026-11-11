import { describe, it, expect, vi, beforeEach } from "vitest"

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))
vi.mock("@/lib/supabase/service-role", () => ({ createServiceRoleClient: () => ({ rpc }) }))

import { checkRateLimit } from "@/lib/rate-limit"

beforeEach(() => {
  rpc.mockReset()
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("checkRateLimit", () => {
  it("işlev true dönerse geçirir", async () => {
    rpc.mockResolvedValue({ data: true, error: null })
    expect(await checkRateLimit("b", 1, 60)).toBe(true)
  })

  it("işlev false dönerse reddeder", async () => {
    rpc.mockResolvedValue({ data: false, error: null })
    expect(await checkRateLimit("b", 1, 60)).toBe(false)
  })

  it("veritabanı hatasında varsayılan olarak geçirir", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "down" } })
    expect(await checkRateLimit("b", 1, 60)).toBe(true)
  })

  it("veritabanı hatasında failClosed ise reddeder", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "down" } })
    expect(await checkRateLimit("b", 1, 60, { failClosed: true })).toBe(false)
  })

  it("fırlatmada varsayılan olarak geçirir", async () => {
    rpc.mockImplementation(async () => {
      throw new Error("boom")
    })
    expect(await checkRateLimit("b", 1, 60)).toBe(true)
  })

  it("fırlatmada failClosed ise reddeder", async () => {
    rpc.mockImplementation(async () => {
      throw new Error("boom")
    })
    expect(await checkRateLimit("b", 1, 60, { failClosed: true })).toBe(false)
  })
})
