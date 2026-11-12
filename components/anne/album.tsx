"use client"

import { useRef, useState } from "react"
import { send } from "@/components/anne/api"

export type AlbumPhoto = { id: string; kind: "karin" | "ultrason"; week: number }

const MAX_EDGE = 1600

/** Fotoğrafı tarayıcıda küçültüp JPEG'e çevirir; böylece yükleme küçük ve hızlı olur, konum bilgisi de silinir. */
async function shrink(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext("2d")
    if (!context) return null
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85))
  } catch {
    return null
  }
}

function Section({
  kind,
  title,
  hint,
  addLabel,
  week,
  photos,
  onAdded,
  onRemoved,
}: {
  kind: AlbumPhoto["kind"]
  title: string
  hint: string
  addLabel: string
  week: number
  photos: AlbumPhoto[]
  onAdded: (photo: AlbumPhoto) => void
  onRemoved: (id: string) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [chosenWeek, setChosenWeek] = useState(week)

  async function upload(file: File) {
    setBusy(true)
    setError("")
    const blob = await shrink(file)
    if (!blob) {
      setBusy(false)
      setError("Bu dosya açılamadı. Lütfen bir fotoğraf seçin.")
      return
    }
    const form = new FormData()
    form.set("kind", kind)
    form.set("week", String(chosenWeek))
    form.set("file", blob, "foto.jpg")
    const result = await send<{ photo: AlbumPhoto }>("/api/anne/album", "POST", form, "Fotoğraf yüklenemedi.")
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onAdded(result.data.photo)
  }

  async function remove(id: string) {
    setError("")
    const result = await send("/api/anne/album", "DELETE", { photo: id }, "Fotoğraf silinemedi.")
    if (!result.ok) {
      setError(result.error)
      return
    }
    onRemoved(id)
  }

  return (
    <section>
      <h3 style={{ marginTop: 24 }}>{title}</h3>
      <p className="nb-note">{hint}</p>

      {photos.length === 0 ? (
        <div className="nb-empty">Henüz fotoğraf yok.</div>
      ) : (
        <div className="nb-grid">
          {photos.map((photo) => (
            <div className="nb-photo" key={photo.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/anne/album?photo=${photo.id}`} alt={`${photo.week}. hafta`} loading="lazy" />
              <span>{photo.week}. hafta</span>
              <button type="button" onClick={() => void remove(photo.id)} aria-label={`${photo.week}. hafta fotoğrafını sil`}>
                Sil
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="nb-error" role="alert">
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <div style={{ width: 104, flex: "none" }}>
          <label className="nb-label" htmlFor={`anne-album-hafta-${kind}`} style={{ marginTop: 14 }}>
            Hafta
          </label>
          <input
            id={`anne-album-hafta-${kind}`}
            className="nb-field"
            type="number"
            inputMode="numeric"
            min={0}
            max={44}
            value={chosenWeek}
            onChange={(e) => setChosenWeek(Math.max(0, Math.min(44, Number(e.target.value) || 0)))}
            style={{ padding: "0 16px" }}
          />
        </div>
        <button className="nb-btn" data-kind={kind === "ultrason" ? "light" : undefined} type="button" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? "Yükleniyor" : addLabel}
        </button>
      </div>
      <input
        ref={input}
        id={`anne-album-dosya-${kind}`}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (file) void upload(file)
        }}
      />
    </section>
  )
}

/** Karın günlüğü ve ultrason albümü. Fotoğraflar yalnızca hesabın sahibine gösterilir. */
export function Album({ week, initial }: { week: number; initial: AlbumPhoto[] }) {
  const [photos, setPhotos] = useState<AlbumPhoto[]>(initial)

  const sorted = (kind: AlbumPhoto["kind"]) => photos.filter((p) => p.kind === kind).sort((a, b) => a.week - b.week)
  const added = (photo: AlbumPhoto) => setPhotos((prev) => [...prev, photo])
  const removed = (id: string) => setPhotos((prev) => prev.filter((p) => p.id !== id))

  return (
    <>
      <Section
        kind="karin"
        title="Karın günlüğü"
        hint="Her hafta aynı pozda bir fotoğraf çek; değişimi yan yana gör."
        addLabel="Bu haftanın fotoğrafını ekle"
        week={week}
        photos={sorted("karin")}
        onAdded={added}
        onRemoved={removed}
      />
      <Section
        kind="ultrason"
        title="Ultrason albümü"
        hint="Çıktının fotoğrafını çek, haftasını yaz; sıraya biz dizelim."
        addLabel="Ultrason ekle"
        week={week}
        photos={sorted("ultrason")}
        onAdded={added}
        onRemoved={removed}
      />
      <p className="nb-note" style={{ marginTop: 18, textAlign: "center", fontSize: 13 }}>
        Fotoğrafların yalnızca senin hesabında durur. Uygulama görüntüleri yorumlamaz.
      </p>
    </>
  )
}
