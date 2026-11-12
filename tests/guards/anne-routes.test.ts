import { describe, it, expect } from "vitest"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { join, sep } from "node:path"

// Hasta uygulamasının (/anne) ayrım kuralları (ana plan, bölüm 6):
//   1. /api/anne altındaki her yol oturumdaki hastayı denetler (giriş yolları kendi denetimini yapar).
//   2. Hasta alanı klinik tablolarına dokunmaz; yalnızca app_ tablolarını kullanır. Tek istisna
//      lib/anne/clinic-match.ts: ilk girişte hastayı tanımak için iki klinik tablosunu okur (9c).
//   3. Hasta alanı personel girişini (Supabase Auth) ve tarayıcı istemcisini kullanmaz.

function files(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(name) ? [p] : []
  })
}

const routes = files(join("app", "api", "anne")).filter((f) => f.endsWith("route.ts"))
const loginRoutes = join("app", "api", "anne", "giris") + sep
const logoutRoute = join("app", "api", "anne", "cikis", "route.ts")
const clinicBridge = join("lib", "anne", "clinic-match.ts")
const patientCode = [join("app", "anne"), join("app", "api", "anne"), join("lib", "anne"), join("components", "anne")].flatMap(files)

describe("/api/anne yolları", () => {
  it("en az bir yol var", () => {
    expect(routes.length).toBeGreaterThan(0)
  })

  for (const file of routes) {
    const source = readFileSync(file, "utf8")
    const handlers = [...source.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)\b/g)].map((m) => m[1])

    if (file.startsWith(loginRoutes) || file === logoutRoute) {
      it(`${file} başka siteden gelen isteği reddeder`, () => {
        expect(source).toContain("isSameOrigin(request)")
      })
      continue
    }

    it(`${file} her işleyicide oturumu denetler`, () => {
      expect(handlers.length).toBeGreaterThan(0)
      const gates = source.match(/const gate = await requireAppUser\(request\)\s*\n\s*if \(!gate\.ok\) return gate\.response/g) ?? []
      expect(gates.length).toBe(handlers.length)
    })

    it(`${file} hesap kimliğini istekten okumaz`, () => {
      expect(source).not.toMatch(/body\??\.(userId|user_id|id)\b/)
      expect(source).not.toMatch(/searchParams\.get\(["'](userId|user_id)["']\)/)
    })
  }
})

describe("hasta alanının ayrımı", () => {
  for (const file of patientCode) {
    const source = readFileSync(file, "utf8")

    if (file === clinicBridge) {
      // Tek istisna: klinik kaydından tanıma. Yalnızca bu iki tabloyu OKUR, yalnızca app_users'a yazar.
      it(`${file} klinik tablolarından yalnızca hasta ve gebelik kaydını okur, onlara yazmaz`, () => {
        const calls = [...source.matchAll(/\.from\(\s*["'`]([^"'`]+)["'`]\s*\)\s*\.(\w+)/g)].map((m) => [m[1], m[2]])
        expect(calls.length).toBeGreaterThan(0)
        for (const [table, op] of calls) {
          if (table.startsWith("app_")) continue
          expect(["patients", "pregnancy_episodes"]).toContain(table)
          expect(op).toBe("select")
        }
        expect(source.match(/\.from\(/g)!.length).toBe(calls.length)
      })
    } else {
      it(`${file} yalnızca app_ tablolarına erişir`, () => {
        const tables = [...source.matchAll(/\.from\(\s*["'`]([^"'`]+)["'`]\s*\)/g)].map((m) => m[1])
        for (const table of tables) expect(table).toMatch(/^app_/)
      })
    }

    it(`${file} personel girişini ve tarayıcı veritabanı istemcisini kullanmaz`, () => {
      expect(source).not.toContain("@/lib/supabase/client")
      expect(source).not.toContain("@/lib/supabase/server")
      expect(source).not.toContain("auth.getUser")
      expect(source).not.toContain("admin_users")
    })
  }
})
