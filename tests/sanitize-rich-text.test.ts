// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { sanitizeRichText } from "@/lib/sanitize-rich-text"

describe("sanitizeRichText", () => {
  it.each([
    ["<script>alert(1)</script>merhaba", "<script"],
    ['<img src=x onerror="alert(1)">', "onerror"],
    ['<img src=x onerror="alert(1)">', "<img"],
    ['<a href="javascript:alert(1)">tıkla</a>', "javascript:"],
    ['<b onclick="alert(1)">kalın</b>', "onclick"],
    ['<iframe src="https://example.com"></iframe>', "<iframe"],
    ["<svg><script>alert(1)</script></svg>", "<svg"],
  ])("tehlikeli içeriği atar: %s", (input, forbidden) => {
    expect(sanitizeRichText(input).toLowerCase()).not.toContain(forbidden)
  })

  it.each([
    "<b>kalın</b>",
    "<i>italik</i>",
    "<u>altı çizili</u>",
    "<ul><li>bir</li><li>iki</li></ul>",
    "<ol><li>bir</li></ol>",
    '<font color="#ff0000">kırmızı</font>',
    '<span style="background-color: yellow;">vurgu</span>',
    "<div>satır</div><div><br></div>",
  ])("araç çubuğunun ürettiği biçimi korur: %s", (html) => {
    expect(sanitizeRichText(html)).toBe(html)
  })

  it("düz metni ve tehlikeli etiketin içindeki yazıyı korur", () => {
    expect(sanitizeRichText('<a href="https://x.test">bağlantı yazısı</a>')).toBe("bağlantı yazısı")
    expect(sanitizeRichText("TA: 120/80")).toBe("TA: 120/80")
  })

  it("boş girdide boş döner", () => {
    expect(sanitizeRichText(null)).toBe("")
    expect(sanitizeRichText(undefined)).toBe("")
    expect(sanitizeRichText("")).toBe("")
  })
})
