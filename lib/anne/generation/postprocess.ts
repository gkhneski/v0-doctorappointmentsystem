import { readFileSync } from "node:fs"
import { join } from "node:path"
import opentype from "opentype.js"
import sharp from "sharp"
import metrics from "@/lib/anne/generation/fonts/dejavu-sans-bold-metrics.json"

// Üretim SONRASI işlemler. Eski sistemdeki iki dosyanın karşılığıdır:
//   backend/generation/scan_line_filter.py  -> removeScanLines
//   backend/generation/polaroid_frame.py    -> addPolaroidFrame
// Sıra, eşikler, katsayılar, renkler ve ölçüler DEĞİŞTİRİLMEZ. tests/anne/generation
// altındaki sınama çıktıyı eski Python kodunun ürettiği görüntülerle karşılaştırır.

type Rgb = { data: Uint8Array; width: number; height: number }

async function decodeRgb(image: Buffer): Promise<Rgb> {
  // PIL: Image.open(...).convert("RGB") — saydamlık atılır, yön bilgisi uygulanmaz.
  const { data, info } = await sharp(image).toColourspace("srgb").removeAlpha().raw().toBuffer({ resolveWithObject: true })
  if (info.channels === 3) return { data: new Uint8Array(data), width: info.width, height: info.height }
  const rgb = new Uint8Array(info.width * info.height * 3)
  for (let i = 0; i < info.width * info.height; i++) {
    const v = data[i * info.channels]
    rgb[i * 3] = v
    rgb[i * 3 + 1] = v
    rgb[i * 3 + 2] = v
  }
  return { data: rgb, width: info.width, height: info.height }
}

function encodePng(rgb: Rgb): Promise<Buffer> {
  return sharp(Buffer.from(rgb.data.buffer, rgb.data.byteOffset, rgb.data.byteLength), {
    raw: { width: rgb.width, height: rgb.height, channels: 3 },
  })
    .png()
    .toBuffer()
}

const f32 = Math.fround

/** PIL ImageFilter.SMOOTH / SHARPEN: 3x3 çekirdek, kenar pikselleri olduğu gibi kalır. */
function filter3x3(src: Uint8Array, width: number, height: number, kernel: number[], scale: number): Uint8Array {
  const out = new Uint8Array(src)
  if (width < 3 || height < 3) return out
  const k = kernel.map((v) => f32(v / scale))
  const stride = width * 3
  for (let y = 1; y < height - 1; y++) {
    const above = (y - 1) * stride
    const here = y * stride
    const below = (y + 1) * stride
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const i = x * 3 + c
        let ss = f32(0.5)
        ss = f32(ss + f32(f32(f32(src[below + i - 3] * k[0]) + f32(src[below + i] * k[1])) + f32(src[below + i + 3] * k[2])))
        ss = f32(ss + f32(f32(f32(src[here + i - 3] * k[3]) + f32(src[here + i] * k[4])) + f32(src[here + i + 3] * k[5])))
        ss = f32(ss + f32(f32(f32(src[above + i - 3] * k[6]) + f32(src[above + i] * k[7])) + f32(src[above + i + 3] * k[8])))
        out[here + i] = ss <= 0 ? 0 : ss >= 255 ? 255 : Math.trunc(ss)
      }
    }
  }
  return out
}

/**
 * Modelin bazen ürettiği yatay çizgileri temizler:
 * komşularından belirgin biçimde ayrışan satır komşularıyla harmanlanır, ardından
 * hafif yumuşatma ve keskinleştirme uygulanır. Hata olursa görüntü olduğu gibi döner.
 */
export async function removeScanLines(image: Buffer): Promise<Buffer> {
  try {
    const { data, width, height } = await decodeRgb(image)
    const smoothed = new Float32Array(data)
    const stride = width * 3

    for (let c = 0; c < 3; c++) {
      for (let row = 1; row < height - 1; row++) {
        const a = (row - 1) * stride + c
        const h = row * stride + c
        const b = (row + 1) * stride + c
        let sumAbove = 0
        let sumBelow = 0
        let sumNeighbor = 0
        for (let x = 0; x < stride; x += 3) {
          sumAbove += Math.abs(data[h + x] - data[a + x])
          sumBelow += Math.abs(data[h + x] - data[b + x])
          sumNeighbor += Math.abs(data[a + x] - data[b + x])
        }
        const diffAbove = sumAbove / width
        const diffBelow = sumBelow / width
        const neighborDiff = sumNeighbor / width

        // Satır iki komşusundan da farklı, ama komşular birbirine benziyorsa: çizgi.
        if (diffAbove > 8 && diffBelow > 8 && neighborDiff < diffAbove * 0.6) {
          const w35 = f32(0.35)
          const w30 = f32(0.3)
          for (let x = 0; x < stride; x += 3) {
            smoothed[h + x] = f32(f32(f32(data[a + x] * w35) + f32(data[h + x] * w30)) + f32(data[b + x] * w35))
          }
        }
      }
    }

    let pixels: Uint8Array = new Uint8Array(data.length)
    for (let i = 0; i < pixels.length; i++) {
      const v = smoothed[i]
      pixels[i] = v <= 0 ? 0 : v >= 255 ? 255 : Math.trunc(v)
    }
    pixels = filter3x3(pixels, width, height, [1, 1, 1, 1, 5, 1, 1, 1, 1], 13) // SMOOTH
    pixels = filter3x3(pixels, width, height, [-2, -2, -2, -2, 32, -2, -2, -2, -2], 16) // SHARPEN
    return await encodePng({ data: pixels, width, height })
  } catch (error) {
    console.error("[ScanLineFilter] Error, returning original:", error instanceof Error ? error.message : error)
    return image
  }
}

// ---- Çerçeve ----

const FONT_FILE = join(process.cwd(), "lib", "anne", "generation", "fonts", "DejaVuSans-Bold.ttf")
let cachedFont: opentype.Font | null = null

/** Eski sunucunun kullandığı yazı tipi (DejaVu Sans Bold); dosyası depoda durur. */
function boldFont(): opentype.Font {
  if (!cachedFont) {
    const file = readFileSync(FONT_FILE)
    cachedFont = opentype.parse(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength))
  }
  return cachedFont
}

type TextLayout = {
  /** PIL textbbox((0, 0), ...) sonucundaki genişlik ve yükseklik. */
  width: number
  height: number
  /** Yazı (0, 0) noktasına çizildiğinde harflerin yolu. */
  pathData: string
}

/** [ilerleme, sol, üst, sağ, alt] — eski sunucudaki yazı çiziminin (FreeType) piksel ölçüleri. */
type GlyphBox = [number, number, number, number, number]
const METRICS = metrics as unknown as { chars: string; sizes: Record<string, GlyphBox[]> }
const CHAR_INDEX = new Map([...METRICS.chars].map((ch, i) => [ch, i]))

/**
 * Yazıyı eski sistemin yaptığı gibi yerleştirir. Harflerin ilerlemesi ve kutuları eski
 * sunucunun ölçü tablosundan gelir (fonts/dejavu-sans-bold-metrics.json); böylece yazının
 * genişliği ve her harfin yeri pikseli pikseline aynıdır. Tabloda olmayan harf ya da boyut
 * için yazı tipinin kendi ölçüleri yuvarlanarak kullanılır.
 */
export function layoutText(text: string, size: number): TextLayout {
  const font = boldFont()
  const scale = size / font.unitsPerEm
  const baseline = Math.ceil(font.ascender * scale)
  const table = METRICS.sizes[String(size)]

  let pen = 0
  let left = 0
  let right = 0
  let top = Infinity
  let bottom = -Infinity
  const parts: string[] = []

  for (const ch of text) {
    const glyph = font.charToGlyph(ch)
    const outline = glyph.getBoundingBox()
    const index = CHAR_INDEX.get(ch)
    const known = table && index !== undefined ? table[index] : undefined

    // Yazı tipinin kendi (yuvarlanmamış) ölçüleri
    const rawLeft = outline.x1 * scale
    const rawRight = outline.x2 * scale
    const rawTop = baseline - outline.y2 * scale
    const rawBottom = baseline - outline.y1 * scale
    const hasOutline = outline.x2 > outline.x1 && outline.y2 > outline.y1

    const box: GlyphBox = known ?? [
      Math.round((glyph.advanceWidth ?? 0) * scale),
      Math.floor(rawLeft),
      Math.floor(rawTop),
      Math.ceil(rawRight),
      Math.ceil(rawBottom),
    ]
    const [advance, l, t, r, b] = box

    if (hasOutline && r > l && b > t) {
      // Harfin çizimi, eski sistemdeki kutusunun ortasına oturtulur.
      const dx = (l + r) / 2 - (rawLeft + rawRight) / 2
      const dy = (t + b) / 2 - (rawTop + rawBottom) / 2
      parts.push(glyph.getPath(pen + dx, baseline + dy, size).toPathData(3))
      top = Math.min(top, t)
      bottom = Math.max(bottom, b)
      right = Math.max(right, pen + r)
      left = Math.min(left, pen + l)
    }
    pen += advance
    right = Math.max(right, pen)
  }

  if (!Number.isFinite(top)) return { width: right - left, height: 0, pathData: "" }
  return { width: right - left, height: bottom - top, pathData: parts.join(" ") }
}

/** Yazının maskesi: PIL'de "L" kipinde, verilen boyuttaki görüntüye (0, 0)'dan çizilen yazı. */
async function textMask(pathData: string, width: number, height: number): Promise<Uint8Array> {
  if (!pathData || width <= 0 || height <= 0) return new Uint8Array(Math.max(0, width * height))
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="100%" height="100%" fill="#000"/><path d="${pathData}" fill="#fff"/></svg>`
  const { data, info } = await sharp(Buffer.from(svg), { density: 72 })
    .resize(width, height, { fit: "fill" })
    .removeAlpha()
    .extractChannel(0)
    .raw()
    .toBuffer({ resolveWithObject: true })
  if (info.width !== width || info.height !== height) throw new Error("Yazı maskesi beklenen boyutta değil")
  return new Uint8Array(data)
}

/** Soldan sağa mor -> magenta -> mavi. */
function gradientColor(x: number, width: number): [number, number, number] {
  const t = x / Math.max(width - 1, 1)
  if (t < 0.5) {
    const lt = t * 2
    return [Math.trunc(160 + (220 - 160) * lt), Math.trunc(32 + (40 - 32) * lt), Math.trunc(240 + (180 - 240) * lt)]
  }
  const lt = (t - 0.5) * 2
  return [Math.trunc(220 + (80 - 220) * lt), Math.trunc(40 + (120 - 40) * lt), Math.trunc(180 + (240 - 180) * lt)]
}

/** PIL'in 8 bit çarpması: (a * b) / 255, yuvarlanmış. */
function mulDiv255(a: number, b: number): number {
  const tmp = a * b + 128
  return ((tmp >> 8) + tmp) >> 8
}

type Rgba = { data: Uint8Array; width: number; height: number }

function fillRect(target: Rgba, x0: number, y0: number, w: number, h: number, color: [number, number, number, number]) {
  const xStart = Math.max(0, x0)
  const yStart = Math.max(0, y0)
  const xEnd = Math.min(target.width, x0 + w)
  const yEnd = Math.min(target.height, y0 + h)
  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const i = (y * target.width + x) * 4
      target.data[i] = color[0]
      target.data[i + 1] = color[1]
      target.data[i + 2] = color[2]
      target.data[i + 3] = color[3]
    }
  }
}

/** PIL: canvas.paste(gradient, (x, y), gradient) — renkli yazı, kendi maskesiyle. */
async function pasteGradientText(canvas: Rgba, x: number, y: number, layout: TextLayout) {
  const width = layout.width + 4
  const height = Math.trunc(layout.height * 1.5)
  if (width <= 0 || height <= 0) return
  const mask = await textMask(layout.pathData, width, height)
  for (let ty = 0; ty < height; ty++) {
    const cy = y + ty
    if (cy < 0 || cy >= canvas.height) continue
    for (let tx = 0; tx < width; tx++) {
      const cx = x + tx
      if (cx < 0 || cx >= canvas.width) continue
      const m = mask[ty * width + tx]
      if (m === 0) continue
      const [r, g, b] = gradientColor(tx, width)
      const i = (cy * canvas.width + cx) * 4
      const inv = 255 - m
      canvas.data[i] = mulDiv255(r, m) + mulDiv255(canvas.data[i], inv)
      canvas.data[i + 1] = mulDiv255(g, m) + mulDiv255(canvas.data[i + 1], inv)
      canvas.data[i + 2] = mulDiv255(b, m) + mulDiv255(canvas.data[i + 2], inv)
      canvas.data[i + 3] = mulDiv255(m, m) + mulDiv255(canvas.data[i + 3], inv)
    }
  }
}

export type FrameOptions = {
  doctorName?: string
  websiteUrl?: string
  babyName?: string
}

/** Üretilen görüntüyü polaroid çerçeveye yerleştirir ve altına yazıları koyar. */
export async function addPolaroidFrame(image: Buffer, options: FrameOptions = {}): Promise<Buffer> {
  const doctorName = options.doctorName ?? "Prof. Dr. Eray Caliskan"
  const websiteUrl = options.websiteUrl ?? "neobreedai.com"
  const babyName = options.babyName ?? ""

  const img = await decodeRgb(image)
  const imgW = img.width
  const imgH = img.height

  const borderSide = Math.trunc(imgW * 0.045)
  const borderTop = Math.trunc(imgH * 0.045)
  const borderBottom = Math.trunc(imgH * 0.13)

  const canvasW = imgW + borderSide * 2
  const canvasH = imgH + borderTop + borderBottom

  const shadowSize = Math.max(6, Math.trunc(imgW * 0.008))
  const finalW = canvasW + shadowSize * 2
  const finalH = canvasH + shadowSize * 2

  const final: Rgba = { data: new Uint8Array(finalW * finalH * 4), width: finalW, height: finalH }
  fillRect(final, 0, 0, finalW, finalH, [25, 25, 25, 255])

  // Gölge
  for (let i = shadowSize; i > 0; i--) {
    const shade = 25 + Math.trunc((shadowSize - i) * (50 / shadowSize))
    const sx = Math.floor((finalW - canvasW - i * 2) / 2) + Math.floor(shadowSize / 2)
    const sy = Math.floor((finalH - canvasH - i * 2) / 2) + Math.floor(shadowSize / 2)
    fillRect(final, sx, sy, canvasW + i * 2, canvasH + i * 2, [shade, shade, shade, 255])
  }

  // Polaroid karton
  const canvas: Rgba = { data: new Uint8Array(canvasW * canvasH * 4), width: canvasW, height: canvasH }
  fillRect(canvas, 0, 0, canvasW, canvasH, [242, 242, 240, 255])

  // İnce iç kenar (2 piksel), ardından görüntü
  fillRect(canvas, borderSide - 2, borderTop - 2, imgW + 4, imgH + 4, [225, 225, 222, 255])
  for (let y = 0; y < imgH; y++) {
    for (let x = 0; x < imgW; x++) {
      const s = (y * imgW + x) * 3
      const d = ((y + borderTop) * canvasW + x + borderSide) * 4
      canvas.data[d] = img.data[s]
      canvas.data[d + 1] = img.data[s + 1]
      canvas.data[d + 2] = img.data[s + 2]
      canvas.data[d + 3] = 255
    }
  }

  const textY = borderTop + imgH + Math.trunc(borderBottom * 0.45)
  const marginX = borderSide + Math.trunc(borderSide * 0.3)

  // Sol alt: "Ultrason 4K"
  const labelText = "Ultrason 4K"
  const labelSize = Math.max(11, Math.trunc(borderBottom * 0.16))
  await pasteGradientText(canvas, marginX, textY, layoutText(labelText, labelSize))

  // Orta: hasta adı
  if (babyName) {
    const babySize = Math.max(11, Math.trunc(borderBottom * 0.15))
    const layout = layoutText(babyName, babySize)
    await pasteGradientText(canvas, Math.floor((canvasW - layout.width) / 2), textY, layout)
  }

  // Sağ: doktor adı + site
  const rightText = `${doctorName}  |  ${websiteUrl}`
  const rightSize = Math.max(11, Math.trunc(borderBottom * 0.14))
  const rightLayout = layoutText(rightText, rightSize)
  await pasteGradientText(canvas, canvasW - marginX - rightLayout.width, textY, rightLayout)

  // Kartonu gölgeli zemine yapıştır (kendi saydamlığıyla)
  const cx = Math.floor((finalW - canvasW) / 2)
  const cy = Math.floor((finalH - canvasH) / 2)
  for (let y = 0; y < canvasH; y++) {
    for (let x = 0; x < canvasW; x++) {
      const s = (y * canvasW + x) * 4
      const d = ((y + cy) * finalW + x + cx) * 4
      const a = canvas.data[s + 3]
      if (a === 255) {
        final.data[d] = canvas.data[s]
        final.data[d + 1] = canvas.data[s + 1]
        final.data[d + 2] = canvas.data[s + 2]
      } else {
        const inv = 255 - a
        final.data[d] = mulDiv255(canvas.data[s], a) + mulDiv255(final.data[d], inv)
        final.data[d + 1] = mulDiv255(canvas.data[s + 1], a) + mulDiv255(final.data[d + 1], inv)
        final.data[d + 2] = mulDiv255(canvas.data[s + 2], a) + mulDiv255(final.data[d + 2], inv)
      }
    }
  }

  const rgb = new Uint8Array(finalW * finalH * 3)
  for (let i = 0, j = 0; i < final.data.length; i += 4, j += 3) {
    rgb[j] = final.data[i]
    rgb[j + 1] = final.data[i + 1]
    rgb[j + 2] = final.data[i + 2]
  }
  return encodePng({ data: rgb, width: finalW, height: finalH })
}
