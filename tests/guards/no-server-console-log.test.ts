import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

// Sunucu kayıtlarına SMS kodu, erişim anahtarı ya da hasta formu düşmesin diye:
// bu klasörlerde hata ayıklama kaydı tutulmaz, yalnızca console.error / console.warn kalır.
const ROOTS = ["app/api", "lib", "app/appointment", "app/patient-form"]

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? sourceFiles(p) : /\.tsx?$/.test(name) ? [p] : []
  })
}

describe("sunucu kodunda hata ayıklama kaydı yok", () => {
  it("console.log / info / debug kullanılmaz", () => {
    const offenders = ROOTS.flatMap(sourceFiles).filter((f) =>
      /console\.(log|info|debug)\b/.test(readFileSync(f, "utf8")),
    )
    expect(offenders).toEqual([])
  })

  it("console.error ve console.warn doğrulama kodu, şifre ya da istek gövdesi yazmaz", () => {
    // Mesaj metinleri ("Error creating access token:") sayılmaz; yalnızca yazdırılan değişkenlere bakılır.
    const stripStrings = (src: string) => src.replace(/"[^"\n]*"|'[^'\n]*'|`[^`]*`/g, '""')
    const banned = /console\.(error|warn)\([^)]*\b(verificationCode|verification\.code|password|body|formData|token)\b/
    const offenders = ROOTS.flatMap(sourceFiles).filter((f) => banned.test(stripStrings(readFileSync(f, "utf8"))))
    expect(offenders).toEqual([])
  })
})
