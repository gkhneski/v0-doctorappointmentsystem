import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

// Kodlar ve bağlantı belirteçleri tahmin edilebilir üreteçle üretilmemeli (lib/secure-random.ts kullanılır).
function tsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? tsFiles(p) : /\.tsx?$/.test(name) ? [p] : []
  })
}

describe("sunucu kodunda Math.random", () => {
  for (const file of ["app/api", "lib"].flatMap(tsFiles)) {
    it(`${file} Math.random kullanmaz`, () => {
      expect(readFileSync(file, "utf8")).not.toContain("Math.random")
    })
  }
})
