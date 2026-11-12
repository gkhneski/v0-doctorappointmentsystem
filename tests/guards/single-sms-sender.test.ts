import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

// G30: SMS sağlayıcısına yalnızca lib/sms.ts gider; şifre adres satırına yazılmaz.
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? sourceFiles(p) : /\.tsx?$/.test(name) ? [p] : []
  })
}

const SENDER = join("lib", "sms.ts")

describe("tek SMS gönderim işlevi", () => {
  for (const file of ["app", "lib", "components"].flatMap(sourceFiles)) {
    if (file === SENDER) continue
    it(`${file} sağlayıcıya doğrudan gitmez`, () => {
      const source = readFileSync(file, "utf8")
      expect(source).not.toContain("netgsm.com.tr")
      expect(source).not.toContain("NETGSM_PASSWORD")
    })
  }

  it("lib/sms.ts şifreyi adres satırına koymaz", () => {
    const source = readFileSync(SENDER, "utf8")
    expect(source).not.toMatch(/password=/i)
    expect(source).not.toContain("/sms/send/get")
  })
})
