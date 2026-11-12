import sharp from "sharp"

export type Diff = {
  sameSize: boolean
  /** Farklı piksel oranı (0–1). */
  differing: number
  /** Kanal başına en büyük fark (0–255). */
  maxDelta: number
  /** Kanal başına ortalama fark. */
  meanDelta: number
}

async function rgb(image: Buffer) {
  const { data, info } = await sharp(image).removeAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height, channels: info.channels }
}

/** İki görüntüyü piksel piksel karşılaştırır; isteğe bağlı olarak yalnızca bir dikdörtgenin içini ya da dışını. */
export async function diffImages(
  a: Buffer,
  b: Buffer,
  region?: { x: number; y: number; width: number; height: number; outside?: boolean },
): Promise<Diff> {
  const [p, q] = await Promise.all([rgb(a), rgb(b)])
  if (p.width !== q.width || p.height !== q.height || p.channels !== q.channels) {
    return { sameSize: false, differing: 1, maxDelta: 255, meanDelta: 255 }
  }
  let counted = 0
  let differing = 0
  let maxDelta = 0
  let total = 0
  for (let y = 0; y < p.height; y++) {
    for (let x = 0; x < p.width; x++) {
      if (region) {
        const inside = x >= region.x && x < region.x + region.width && y >= region.y && y < region.y + region.height
        if (inside === Boolean(region.outside)) continue
      }
      const i = (y * p.width + x) * p.channels
      let pixelDelta = 0
      for (let c = 0; c < p.channels; c++) {
        const d = Math.abs(p.data[i + c] - q.data[i + c])
        pixelDelta = Math.max(pixelDelta, d)
        total += d
      }
      counted++
      if (pixelDelta > 0) differing++
      maxDelta = Math.max(maxDelta, pixelDelta)
    }
  }
  return { sameSize: true, differing: counted ? differing / counted : 0, maxDelta, meanDelta: counted ? total / (counted * p.channels) : 0 }
}
