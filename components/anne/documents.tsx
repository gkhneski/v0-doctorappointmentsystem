"use client"

import { useRef, useState } from "react"
import { send } from "@/components/anne/api"
import {
  DOCUMENT_CATEGORIES,
  MAX_DOCUMENT_BYTES,
  MAX_TITLE_LENGTH,
  documentCategoryLabel,
  type AppDocument,
  type DocumentCategory,
} from "@/lib/anne/document-types"

const MAX_EDGE = 2000

/**
 * Fotoğrafı tarayıcıda küçültüp JPEG'e çevirir: yükleme hızlanır, konum bilgisi silinir.
 * Tahlil kâğıdındaki küçük yazılar okunabilsin diye albümden daha büyük ve kaliteli tutulur.
 */
async function shrink(file: File, edge = MAX_EDGE): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext("2d")
    if (!context) return null
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88))
    if (blob && blob.size > MAX_DOCUMENT_BYTES && edge > 1400) return shrink(file, 1400)
    return blob
  } catch {
    return null
  }
}

function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", timeZone: "Europe/Istanbul" }).format(new Date(iso))
}

/** Hastanın belgeleri: tahlil, rapor, reçete. Yüklenenleri klinik hasta kartında görür. */
export function Documents({ initial }: { initial: AppDocument[] }) {
  const [documents, setDocuments] = useState(initial)
  const [category, setCategory] = useState<DocumentCategory>("kan_tahlili")
  const [title, setTitle] = useState("")
  const [agreed, setAgreed] = useState(initial.length > 0)
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")
  const [freshIds, setFreshIds] = useState<string[]>([])
  const [asking, setAsking] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  const counts = new Map<string, number>()
  for (const doc of documents) counts.set(doc.category, (counts.get(doc.category) ?? 0) + 1)

  async function upload(files: File[]) {
    setError("")
    let done = 0
    for (const file of files) {
      setBusy(files.length > 1 ? `Yükleniyor ${done + 1}/${files.length}` : "Yükleniyor")
      const pdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
      const blob = pdf ? file : await shrink(file)
      if (!blob) {
        setError("Bu dosya açılamadı. Fotoğraf ya da PDF seç.")
        continue
      }
      if (blob.size > MAX_DOCUMENT_BYTES) {
        setError("Dosya çok büyük (en çok 4 MB). Sayfaların fotoğrafını çekip yükleyebilirsin.")
        continue
      }
      const form = new FormData()
      form.set("tur", category)
      form.set("baslik", title)
      form.set("onay", "1")
      form.set("dosya", blob, pdf ? "belge.pdf" : "belge.jpg")
      const result = await send<{ document: AppDocument }>("/api/anne/belgeler", "POST", form, "Belge yüklenemedi.")
      if (!result.ok) {
        setError(result.error)
        break
      }
      done++
      setDocuments((prev) => [result.data.document, ...prev])
      setFreshIds((prev) => [...prev, result.data.document.id])
    }
    setBusy("")
    if (done > 0) setTitle("")
  }

  async function remove(id: string) {
    setError("")
    const result = await send("/api/anne/belgeler", "DELETE", { belge: id }, "Belge silinemedi.")
    setAsking(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <>
      <section>
        <h3 style={{ marginTop: 8 }}>Ne yüklüyorsun?</h3>
        <div className="nb-cats">
          {DOCUMENT_CATEGORIES.map((item) => (
            <button
              key={item.id}
              className="nb-cat"
              data-tone={item.tone === "plain" ? undefined : item.tone}
              type="button"
              aria-pressed={category === item.id}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
              {counts.has(item.id) && <i>{counts.get(item.id)}</i>}
            </button>
          ))}
        </div>

        <label className="nb-label" htmlFor="anne-belge-baslik">
          Not (istersen)
        </label>
        <input
          id="anne-belge-baslik"
          className="nb-field"
          type="text"
          maxLength={MAX_TITLE_LENGTH}
          placeholder="Örn. 12 Kasım hemogram"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="nb-check" style={{ marginTop: 14 }}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>Yüklediğim belgeleri Prof. Dr. Eray Çalışkan ve klinik ekibinin görmesini onaylıyorum.</span>
        </label>

        {error && (
          <p className="nb-error" role="alert">
            {error}
          </p>
        )}

        <button className="nb-btn" type="button" disabled={!agreed || Boolean(busy)} onClick={() => input.current?.click()}>
          {busy || `${documentCategoryLabel(category)} ekle`}
        </button>
        <p className="nb-note" style={{ marginTop: 8, textAlign: "center", fontSize: 13 }}>
          Fotoğrafını çek ya da PDF seç. Birden çok sayfa seçebilirsin.
        </p>
        <input
          ref={input}
          id="anne-belge-dosya"
          type="file"
          accept="image/*,application/pdf"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []).slice(0, 10)
            e.target.value = ""
            if (files.length > 0) void upload(files)
          }}
        />
      </section>

      <section>
        <div className="nb-head">
          <h3>Belgelerin</h3>
          {documents.length > 0 && <span className="nb-note">{documents.length} belge</span>}
        </div>
        {documents.length === 0 ? (
          <div className="nb-empty">Henüz belge yok. İlk tahlilini yükle, doktorun randevudan önce görsün.</div>
        ) : (
          <ul className="nb-docs">
            {documents.map((doc) => {
              const href = `/api/anne/belgeler?dosya=${doc.id}`
              return (
                <li className="nb-doc" key={doc.id} data-new={freshIds.includes(doc.id) ? "" : undefined}>
                  <a className="nb-doc-thumb" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${documentCategoryLabel(doc.category)} belgesini aç`}>
                    {doc.mime === "application/pdf" ? (
                      "PDF"
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={href} alt="" loading="lazy" />
                    )}
                  </a>
                  <div className="nb-doc-body">
                    <b>{doc.title ?? documentCategoryLabel(doc.category)}</b>
                    <span>
                      {doc.title ? `${documentCategoryLabel(doc.category)} · ` : ""}
                      {formatDay(doc.createdAt)}
                    </span>
                    <span className="nb-chip" data-seen={doc.seen ? "" : undefined}>
                      {doc.seen ? "Klinik gördü ✓" : "Kliniğe iletildi"}
                    </span>
                  </div>
                  {asking === doc.id ? (
                    <button type="button" onClick={() => void remove(doc.id)} style={{ background: "var(--pink)" }} aria-label="Silmeyi onayla">
                      Emin?
                    </button>
                  ) : (
                    <button type="button" onClick={() => setAsking(doc.id)} aria-label={`${doc.title ?? documentCategoryLabel(doc.category)} belgesini sil`}>
                      Sil
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <p className="nb-note" style={{ marginTop: 18, textAlign: "center", fontSize: 13 }}>
        Belgelerini yalnızca sen ve kliniğin görür. Uygulama sonuçları yorumlamaz; sonuçlarını doktorunla konuş.
      </p>
    </>
  )
}
