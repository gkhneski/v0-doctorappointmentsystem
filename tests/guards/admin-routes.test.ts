import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

// Servis rolüyle hassas veri değiştiren yollar. Ara katman (lib/supabase/proxy.ts) bunları
// zaten koruyor; bu test her işleyicinin kendi içinde de kontrol yaptığını güvenceye alır.
const ROOTS = ["app/api/admin", "app/api/patients", "app/api/weekly-patterns"]

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? routeFiles(p) : name === "route.ts" ? [p] : []
  })
}

describe("yönetici yolları", () => {
  for (const file of ROOTS.flatMap(routeFiles)) {
    it(`${file} her işleyicide yetki kontrolü yapar`, () => {
      const src = readFileSync(file, "utf8")
      const handlers = src.match(/export async function (GET|POST|PUT|PATCH|DELETE)\b/g) ?? []
      const checks = src.match(/requireAdmin\(|getAdminAuth\(|auth\.getUser\(/g) ?? []
      expect(handlers.length).toBeGreaterThan(0)
      expect(checks.length).toBeGreaterThanOrEqual(handlers.length)
    })
  }
})
