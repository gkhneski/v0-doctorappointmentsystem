"use client"

import { useState } from "react"
import type { ReactNode } from "react"

const TONES = [
  { key: "pembe", label: "Pembe kart", color: "#FBD3DC" },
  { key: "lila", label: "Lila kart", color: "#EADCF6" },
  { key: "seftali", label: "Şeftali kart", color: "#FCE3D4" },
] as const

const FONT = "Urbanist, system-ui, sans-serif"

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

/** Kartı 1080×1350 bir görsele çizer. Kartta ad ve sağlık bilgisi yer almaz. */
async function drawCard(color: string, week: number, line: string, babySrc: string | null): Promise<Blob | null> {
  const canvas = document.createElement("canvas")
  canvas.width = 1080
  canvas.height = 1350
  const c = canvas.getContext("2d")
  if (!c) return null
  await document.fonts?.ready

  c.fillStyle = color
  c.fillRect(0, 0, 1080, 1350)
  c.fillStyle = "#FFFFFF"
  c.font = `800 560px ${FONT}`
  c.textBaseline = "top"
  c.fillText(String(week), 50, 20)

  if (babySrc) {
    const baby = await loadImage(babySrc)
    if (baby) {
      const size = 640
      const scale = Math.min(size / baby.width, size / baby.height)
      c.drawImage(baby, 540 - (baby.width * scale) / 2, 620 - (baby.height * scale) / 2, baby.width * scale, baby.height * scale)
    }
  }

  c.fillStyle = "#1F1F1F"
  c.textBaseline = "alphabetic"
  c.font = `800 84px ${FONT}`
  const head = `${week} haftalık`
  c.fillText(head, 64, 1150)
  c.font = `400 84px ${FONT}`
  c.fillText(" olduk", 64 + c.measureText(head).width - 14, 1150)
  c.font = `500 40px ${FONT}`
  c.fillText(line, 64, 1220)
  c.font = `800 34px ${FONT}`
  c.fillText("NEOBREED", 64, 1290)

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"))
}

/** Hafta kartı: renk seç, aileye gönder ya da telefona kaydet. */
export function ShareCard({ week, line, baby, babySrc }: { week: number; line: string; baby: ReactNode; babySrc: string | null }) {
  const [tone, setTone] = useState<(typeof TONES)[number]>(TONES[0])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  async function make(): Promise<File | null> {
    const blob = await drawCard(tone.color, week, line, babySrc)
    return blob ? new File([blob], `neobreed-${week}-hafta.png`, { type: "image/png" }) : null
  }

  async function share() {
    setBusy(true)
    setMessage("")
    const file = await make()
    setBusy(false)
    if (!file) {
      setMessage("Kart hazırlanamadı. Lütfen yeniden deneyin.")
      return
    }
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: `${week} haftalık olduk` })
      } catch {
        // Paylaşım penceresi kapatıldı; yapılacak bir şey yok.
      }
      return
    }
    setMessage('Bu cihazda doğrudan paylaşım açılamıyor. "Telefona kaydet" ile indirip gönderebilirsin.')
  }

  async function save() {
    setBusy(true)
    setMessage("")
    const file = await make()
    setBusy(false)
    if (!file) {
      setMessage("Kart hazırlanamadı. Lütfen yeniden deneyin.")
      return
    }
    const url = URL.createObjectURL(file)
    const link = document.createElement("a")
    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  return (
    <>
      <div className="nb-sharecard" style={{ background: tone.color }}>
        <p className="nb-letters" aria-hidden="true" style={{ position: "absolute", left: 14, top: 10, fontSize: 190, color: "#fff" }}>
          {week}
        </p>
        <div style={{ position: "absolute", left: "50%", top: 96, transform: "translateX(-50%)" }}>{baby}</div>
        <div style={{ position: "absolute", left: 22, right: 22, bottom: 20 }}>
          <h1 style={{ fontSize: 30 }}>
            <b>{week} haftalık</b> olduk
          </h1>
          <p style={{ marginTop: 4, fontSize: 15 }}>{line}</p>
        </div>
      </div>

      <div className="nb-swatches" role="group" aria-label="Kart rengi">
        {TONES.map((t) => (
          <button key={t.key} type="button" aria-label={t.label} aria-pressed={t.key === tone.key} style={{ background: t.color }} onClick={() => setTone(t)} />
        ))}
      </div>

      <div className="nb-grow" />
      {message && (
        <p className="nb-error" role="status">
          {message}
        </p>
      )}
      <button className="nb-btn" type="button" disabled={busy} onClick={() => void share()}>
        {busy ? "Hazırlanıyor" : "Aileye gönder"}
      </button>
      <button className="nb-btn" data-kind="light" type="button" disabled={busy} onClick={() => void save()} style={{ marginTop: 10 }}>
        Telefona kaydet
      </button>
      <p className="nb-note" style={{ marginTop: 12, textAlign: "center", fontSize: 13 }}>
        Kartta adın ve sağlık bilgin yer almaz.
      </p>
    </>
  )
}
