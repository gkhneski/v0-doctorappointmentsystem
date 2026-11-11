import { describe, it, expect } from "vitest"
import { generateVerificationCode, generateUrlToken } from "@/lib/secure-random"

describe("secure-random", () => {
  it("doğrulama kodu her zaman 6 hanelidir", () => {
    for (let i = 0; i < 200; i++) expect(generateVerificationCode()).toMatch(/^\d{6}$/)
  })

  it("bağlantı belirteci 32 karakter, adres için güvenli ve tekrarsızdır", () => {
    const tokens = Array.from({ length: 200 }, () => generateUrlToken())
    for (const t of tokens) expect(t).toMatch(/^[A-Za-z0-9_-]{32}$/)
    expect(new Set(tokens).size).toBe(200)
  })
})
