"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import { accessoryOf, accessorySvg, type Accessory, type LookItem } from "@/lib/anne/look"

// "Süsle"nin çizim tarafı: aksesuar katmanı, ana ekrandaki küçük yüz ve paylaşım resmi.
// Aksesuar çizimleri lib/anne/look.ts içindeki sabit SVG parçalarıdır; dışarıdan metin almaz.

/** Tek bir aksesuar çizimi. */
export function AccessoryArt({ accessory, style, className }: { accessory: Accessory; style?: CSSProperties; className?: string }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox={`0 0 ${accessory.w} ${accessory.h}`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: accessory.svg }}
    />
  )
}

/**
 * Aksesuar katmanı. Kutusu resmin tamamını kaplamalıdır (kırpılan kısımlar dahil);
 * aksesuarların yeri resme göre tutulur, böylece her ekranda aynı yere düşer.
 */
export function LookLayer({ items, selected, style, hidden }: { items: LookItem[]; selected?: string | null; style: CSSProperties; hidden?: boolean }) {
  return (
    <span className="nb-look" data-hidden={hidden ? "" : undefined} style={style} aria-hidden="true">
      {items.map((item) => {
        const accessory = accessoryOf(item.item)
        if (!accessory) return null
        return (
          <AccessoryArt
            key={item.item}
            accessory={accessory}
            className="nb-look-item"
            style={{
              left: `${item.x * 100}%`,
              top: `${item.y * 100}%`,
              width: `${item.size * 100}%`,
              aspectRatio: `${accessory.w} / ${accessory.h}`,
              transform: `translate(-50%, -50%) rotate(${item.rot}deg)`,
              outline: selected === item.item ? "2px dashed #fff" : undefined,
            }}
          />
        )
      })}
    </span>
  )
}

/** Resmin en-boy oranını (genişlik / yükseklik) yüklendiğinde bildirir. */
export function useImageRatio() {
  const ref = useRef<HTMLImageElement>(null)
  const [ratio, setRatio] = useState<number | null>(null)
  const measure = () => {
    const image = ref.current
    if (image && image.naturalWidth > 0 && image.naturalHeight > 0) setRatio(image.naturalWidth / image.naturalHeight)
  }
  // Resim, ekran etkileşimli hale gelmeden önce yüklenmiş olabilir.
  useEffect(measure, [])
  return { ref, ratio, onLoad: measure }
}

/** Ana ekrandaki yuvarlak bebek yüzü; takılı aksesuarlarla birlikte. */
export function BabyThumb({ faceId, items }: { faceId: string; items: LookItem[] }) {
  const { ref, ratio, onLoad } = useImageRatio()
  // Resim kareye genişliğiyle sığar; dikeyde yüzün olduğu yer (%38) gösterilir (anne.css ile aynı).
  const layer: CSSProperties | null = ratio
    ? { left: 0, width: "100%", height: `${100 / ratio}%`, top: `${(1 - 1 / ratio) * 38}%` }
    : null
  return (
    <span className="nb-baby-thumb">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={ref} onLoad={onLoad} src={`/api/anne/canli?yuz=${faceId}`} alt="Bebeğinin yüzü" width={128} height={128} />
      {layer && items.length > 0 && <LookLayer items={items} style={layer} />}
    </span>
  )
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("resim yüklenemedi"))
    image.src = src
  })
}

/** Yüz resmini aksesuarlarıyla tek bir JPEG olarak çizer (paylaşmak ya da indirmek için). */
export async function renderLook(faceUrl: string, items: LookItem[]): Promise<Blob | null> {
  const face = await loadImage(faceUrl)
  const width = face.naturalWidth
  const height = face.naturalHeight
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) return null
  context.drawImage(face, 0, 0)

  for (const item of items) {
    const accessory = accessoryOf(item.item)
    if (!accessory) continue
    const w = item.size * width
    const h = (w * accessory.h) / accessory.w
    const art = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(accessorySvg(accessory, Math.max(8, Math.round(w))))}`)
    context.save()
    context.translate(item.x * width, item.y * height)
    context.rotate((item.rot * Math.PI) / 180)
    context.drawImage(art, -w / 2, -h / 2, w, h)
    context.restore()
  }

  // Paylaşılan resimde ne olduğu yazar; klinik ya da doktor adı yer almaz.
  const size = Math.round(width * 0.028)
  const label = "Yapay zekâ ile üretilmiştir"
  context.font = `600 ${size}px system-ui, sans-serif`
  const pad = Math.round(size * 0.7)
  const box = context.measureText(label).width + pad * 2
  context.fillStyle = "rgba(0, 0, 0, 0.45)"
  context.fillRect(0, height - size - pad * 2, box, size + pad * 2)
  context.fillStyle = "#fff"
  context.textBaseline = "middle"
  context.fillText(label, pad, height - pad - size / 2)

  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92))
}
