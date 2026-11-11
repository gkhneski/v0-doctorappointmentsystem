import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import nextConfig from "../../next.config.mjs"

// Rol kararı (11.11.2026): hemşire ile sekreter aynı haklara sahiptir. Yalnızca doktora ait olanlar:
// personel yönetimi, hasta silme, SMS şablonu oluşturma/düzenleme/silme.
const handlerBody = (src: string, method: string) => {
  const start = src.indexOf(`export async function ${method}(`)
  expect(start).toBeGreaterThan(-1)
  const next = src.indexOf("export async function ", start + 10)
  return src.slice(start, next === -1 ? undefined : next)
}

describe("roller (G28)", () => {
  const list = readFileSync("app/api/admin/sms-templates/route.ts", "utf8")
  const item = readFileSync("app/api/admin/sms-templates/[id]/route.ts", "utf8")
  const patient = readFileSync("app/api/admin/patients/[patientId]/route.ts", "utf8")
  const sidebar = readFileSync("components/admin/admin-sidebar.tsx", "utf8")

  it("SMS şablonlarını tüm personel okur", () => {
    expect(handlerBody(list, "GET")).toContain("requireAdmin()")
  })

  it.each([
    ["POST", () => list],
    ["PUT", () => item],
    ["DELETE", () => item],
  ])("SMS şablonu %s yalnızca doktora açıktır", (method, src) => {
    expect(handlerBody(src(), method)).toContain('requireAdmin({ role: "doktor" })')
  })

  it("hasta silme yalnızca doktora açıktır", () => {
    expect(handlerBody(patient, "DELETE")).toContain('requireAdmin({ role: "doktor" })')
  })

  it("menüde hemşire ile sekreter aynı sayfaları görür", () => {
    const roleLists = sidebar.match(/roles: \[[^\]]*\]/g) ?? []
    expect(roleLists.length).toBeGreaterThan(0)
    for (const roles of roleLists) {
      expect(roles.includes('"sekreter"')).toBe(roles.includes('"hemsire"'))
    }
  })
})

describe("güvenlik başlıkları (G29)", () => {
  it("tüm sayfalara temel başlıkları ekler", async () => {
    const rules = await (nextConfig as any).headers()
    const all = rules.find((r: any) => r.source === "/(.*)")
    const headers = Object.fromEntries(all.headers.map((h: any) => [h.key.toLowerCase(), h.value]))
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN")
    expect(headers["content-security-policy"]).toBe("frame-ancestors 'self'")
    expect(headers["x-content-type-options"]).toBe("nosniff")
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin")
    expect(headers["strict-transport-security"]).toContain("max-age=63072000")
    expect(headers["permissions-policy"]).toContain("camera=()")
  })
})

describe("hata iletileri (G31)", () => {
  it.each(["app/api/appointments/route.ts", "app/api/appointments/verify/route.ts"])(
    "%s iç hata metnini kullanıcıya göstermez",
    (file) => {
      expect(readFileSync(file, "utf8")).not.toContain("error instanceof Error ? error.message")
    },
  )
})
