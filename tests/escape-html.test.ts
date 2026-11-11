import { describe, it, expect } from "vitest"
import { escapeHtml } from "@/lib/escape-html"

describe("escapeHtml", () => {
  it("etiketleri etkisizleştirir", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;")
  })
  it("& ve tek tırnağı kaçışlar", () => {
    expect(escapeHtml("Ali & Veli's")).toBe("Ali &amp; Veli&#39;s")
  })
  it("Türkçe karakterlere dokunmaz", () => {
    expect(escapeHtml("Ayşe Gül Öztürk İĞŞÇ")).toBe("Ayşe Gül Öztürk İĞŞÇ")
  })
  it("null ve undefined için boş metin döner", () => {
    expect(escapeHtml(null)).toBe("")
    expect(escapeHtml(undefined)).toBe("")
  })
  it("sayıyı metne çevirir", () => {
    expect(escapeHtml(1500)).toBe("1500")
  })
  it("çift kaçışlamaz: & önce işlenir", () => {
    expect(escapeHtml("<&>")).toBe("&lt;&amp;&gt;")
  })
})
