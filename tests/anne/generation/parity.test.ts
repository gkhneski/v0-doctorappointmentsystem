import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import sharp from "sharp"
import { analyzeBiometrics, generateAiParameters, mergeOcrResult, type Gender } from "@/lib/anne/generation/biometrics"
import { REPLICATE_MODEL } from "@/lib/anne/generation/enhance"
import { OCR_SYSTEM_PROMPT, OCR_USER_PROMPT } from "@/lib/anne/generation/ocr"
import { addPolaroidFrame, layoutText, removeScanLines } from "@/lib/anne/generation/postprocess"
import { REPLICATE_SYSTEM_MESSAGE, SYSTEM_MESSAGE, buildScientificPrompt } from "@/lib/anne/generation/prompt"
import { pyFixed, pyPercent0, pyRound } from "@/lib/anne/generation/pynum"
import { VALIDATOR_PROMPT, VALIDATOR_SYSTEM_MESSAGE } from "@/lib/anne/generation/validator"
import { diffImages } from "./compare"

// ESKİ SİSTEMLE AYNILIK SINAMASI.
//
// fixtures/ altındaki dosyalar, eski NeoBreed Python kodu HİÇ DEĞİŞTİRİLMEDEN çalıştırılarak
// üretildi (scripts/anne/referans/). Bu sınamalar yeni kodun aynı girdiden aynı çıktıyı
// verdiğini denetler. Biri kırılırsa üretim eski sistemden sapmış demektir: sınamayı değil,
// kodu düzeltin.

const dir = join("tests", "anne", "generation", "fixtures")
const json = (name: string) => JSON.parse(readFileSync(join(dir, name), "utf8"))
const file = (name: string) => readFileSync(join(dir, name))

describe("Python sayı biçimi", () => {
  it("tam ortadaki değeri çift basamağa yuvarlar", () => {
    expect(pyFixed(0.125, 2)).toBe("0.12")
    expect(pyFixed(0.375, 2)).toBe("0.38")
    expect(pyFixed(4.25, 1)).toBe("4.2")
    expect(pyFixed(4.75, 1)).toBe("4.8")
    expect(pyFixed(0.5, 0)).toBe("0")
    expect(pyFixed(1.5, 0)).toBe("2")
    expect(pyFixed(2.5, 0)).toBe("2")
  })

  it("diğer değerlerde olağan yuvarlama yapar", () => {
    expect(pyFixed(63.7, 1)).toBe("63.7")
    expect(pyFixed(0.145, 2)).toBe("0.14")
    expect(pyFixed(0.9, 2)).toBe("0.90")
    expect(pyRound(78.35178, 2)).toBe(78.35)
    expect(pyPercent0(0.647)).toBe("65%")
  })
})

describe("üretim yönergesi", () => {
  const cases: { name: string; bio: Record<string, unknown>; week: number; gender: Gender; analysis: unknown; prompt: string }[] =
    json("prompts.json")

  it("referans dosyasında yeterince durum var", () => {
    expect(cases.length).toBeGreaterThanOrEqual(10)
  })

  for (const c of cases) {
    it(`${c.name}: ölçüm analizi eski sistemle aynı`, () => {
      expect(analyzeBiometrics(c.bio)).toEqual(c.analysis)
    })

    it(`${c.name}: yönerge eski sistemle harfi harfine aynı`, () => {
      const params = generateAiParameters(analyzeBiometrics(c.bio), c.week, c.gender)
      expect(buildScientificPrompt(params)).toBe(c.prompt)
    })
  }
})

describe("sabit metinler", () => {
  const texts = json("texts.json")

  it("kâğıt okuma metinleri aynı", () => {
    expect(OCR_SYSTEM_PROMPT).toBe(texts.ocr_system)
    expect(OCR_USER_PROMPT).toBe(texts.ocr_user)
  })

  it("görüntü denetimi metinleri aynı", () => {
    expect(VALIDATOR_SYSTEM_MESSAGE).toBe(texts.validator_system)
    expect(VALIDATOR_PROMPT).toBe(texts.validator_prompt)
  })

  it("üretim sistem mesajları ve yedek model aynı", () => {
    expect(SYSTEM_MESSAGE).toBe(texts.gemini_system)
    expect(REPLICATE_SYSTEM_MESSAGE).toBe(texts.replicate_system)
    expect(REPLICATE_MODEL).toBe(texts.replicate_model)
  })
})

describe("kâğıttan okunan değerler", () => {
  it("yalnızca eski sihirbazın aldığı 13 alanı alır; göz ölçüsünü eye_diameter olarak yazar", () => {
    const { biometrics, filled } = mergeOcrResult({}, { bpd: 63.7, eye: 9.6, humerus: 40, cerebellum: 25, chin: null, confidence: 90 })
    expect(biometrics).toEqual({ bpd: 63.7, eye_diameter: 9.6 })
    expect(filled).toBe(2)
  })

  it("ikinci kâğıtta okunan değer ilkinin üstüne yazılır, okunmayan korunur", () => {
    const first = mergeOcrResult({}, { bpd: 60, hc: 220 }).biometrics
    const second = mergeOcrResult(first, { bpd: 63.7, hc: null, fl: "46.2" })
    expect(second.biometrics).toEqual({ bpd: 63.7, hc: 220, fl: 46.2 })
  })
})

describe("çizgi temizleme", () => {
  it("eski sistemle piksel piksel aynı", async () => {
    const result = await removeScanLines(file("scan-input.png"))
    expect(await diffImages(result, file("scan-output.png"))).toEqual({ sameSize: true, differing: 0, maxDelta: 0, meanDelta: 0 })
  })

  it("açılamayan veriyi olduğu gibi geri verir", async () => {
    const broken = Buffer.from("bu bir görüntü değil")
    expect(await removeScanLines(broken)).toBe(broken)
  })
})

describe("çerçeve", () => {
  const frames: { name: string; width: number; height: number; baby: string; boxes: Record<string, number[] | null> }[] = json("frames.json")

  for (const f of frames) {
    const bottom = Math.trunc(f.height * 0.13)
    const sizes = {
      label: Math.max(11, Math.trunc(bottom * 0.16)),
      baby: Math.max(11, Math.trunc(bottom * 0.15)),
      right: Math.max(11, Math.trunc(bottom * 0.14)),
    }
    const texts = { label: "Ultrason 4K", baby: f.baby, right: "Prof. Dr. Eray Caliskan  |  neobreedai.com" }

    it(`${f.name}: yazıların genişliği ve yüksekliği eski sistemle aynı`, () => {
      for (const key of ["label", "baby", "right"] as const) {
        const box = f.boxes[key]
        if (!box) continue
        const layout = layoutText(texts[key], sizes[key])
        expect([layout.width, layout.height]).toEqual([box[2] - box[0], box[3] - box[1]])
      }
    })

    it(`${f.name}: yazı bandı dışındaki her piksel eski sistemle aynı`, async () => {
      const result = await addPolaroidFrame(file(`frame-${f.name}-input.png`), { babyName: f.baby })
      const expected = file(`frame-${f.name}-output.png`)
      const meta = await sharp(result).metadata()
      const shadow = Math.max(6, Math.trunc(f.width * 0.008))
      const bandTop = shadow + Math.trunc(f.height * 0.045) + f.height + 2
      const band = { x: 0, y: bandTop, width: meta.width!, height: meta.height! - bandTop }

      const outside = await diffImages(result, expected, { ...band, outside: true })
      expect(outside).toEqual({ sameSize: true, differing: 0, maxDelta: 0, meanDelta: 0 })

      // Yazı bandında harflerin yeri aynıdır; fark yalnızca harf kenarlarının yumuşatılmasındadır.
      const inside = await diffImages(result, expected, band)
      expect(inside.differing).toBeLessThan(0.15)
      expect(inside.meanDelta).toBeLessThan(3)
    })
  }
})
