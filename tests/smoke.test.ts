import { describe, it, expect } from "vitest"
import { normalizePhone } from "@/lib/phone"

describe("test altyapısı", () => {
  it("@ takma adı lib dosyalarını çözer", () => {
    expect(typeof normalizePhone).toBe("function")
  })
})
