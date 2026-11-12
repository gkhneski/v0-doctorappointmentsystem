"use client"

import { useState } from "react"
import { send } from "@/components/anne/api"

export type VisitQuestion = { id: string; body: string; asked: boolean }

/**
 * Sor ekranı. Onaylı yanıt bankası henüz boş olduğu için her soru vizite listesine eklenir;
 * uygulama kendi başına yanıt üretmez.
 */
export function VisitQuestions({ initial }: { initial: VisitQuestion[] }) {
  const [items, setItems] = useState<VisitQuestion[]>(initial)
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const open = items.filter((q) => !q.asked).length

  async function add() {
    const body = text.trim()
    if (body.length < 3) return
    setBusy(true)
    setError("")
    const result = await send<{ question: VisitQuestion }>("/api/anne/sorular", "POST", { body }, "Soru eklenemedi.")
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setItems((prev) => [...prev, result.data.question])
    setText("")
  }

  async function update(id: string, change: { asked: boolean } | "delete") {
    setError("")
    const before = items
    setItems((prev) =>
      change === "delete" ? prev.filter((q) => q.id !== id) : prev.map((q) => (q.id === id ? { ...q, asked: change.asked } : q)),
    )
    const result =
      change === "delete"
        ? await send("/api/anne/sorular", "DELETE", { question: id }, "Silinemedi.")
        : await send("/api/anne/sorular", "PUT", { question: id, asked: change.asked }, "Güncellenemedi.")
    if (!result.ok) {
      setItems(before)
      setError(result.error)
    }
  }

  return (
    <>
      <p className="nb-note" style={{ marginTop: 10, fontSize: 15 }}>
        Aklına takılanı yaz, vizite listene ekleyelim. Vizitede sorduğunu işaretle.
      </p>

      {items.length === 0 ? (
        <div className="nb-empty">Listen boş. İlk sorunu aşağıya yaz.</div>
      ) : (
        <div style={{ marginTop: 6 }} aria-live="polite">
          {items.map((q) => (
            <div key={q.id} className="nb-check" style={{ alignItems: "center" }}>
              <input
                id={`anne-soru-${q.id}`}
                type="checkbox"
                checked={q.asked}
                onChange={() => void update(q.id, { asked: !q.asked })}
              />
              <label htmlFor={`anne-soru-${q.id}`} style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere", textDecoration: q.asked ? "line-through" : undefined, color: q.asked ? "var(--ink-2)" : undefined }}>
                {q.body}
              </label>
              <button className="nb-link" type="button" style={{ fontSize: 13 }} onClick={() => void update(q.id, "delete")}>
                Sil
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="nb-note" style={{ marginTop: 12, fontSize: 13 }}>
        {open > 0 ? `Sorulmayı bekleyen ${open} soru var.` : "Bekleyen soru yok."} Uygulama kendi başına yanıt üretmez; doktor
        onaylı yanıtlar eklendikçe burada görünecek.
      </p>

      {error && (
        <p className="nb-error" role="alert">
          {error}
        </p>
      )}

      <div className="nb-grow" />
      <form
        style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14 }}
        onSubmit={(e) => {
          e.preventDefault()
          void add()
        }}
      >
        <label className="nb-visually-hidden" htmlFor="anne-soru-yaz">
          Sorunu yaz
        </label>
        <input
          id="anne-soru-yaz"
          className="nb-field"
          type="text"
          maxLength={300}
          placeholder="Sorunu yaz"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ flex: 1, minWidth: 0, marginTop: 0, fontSize: 16 }}
        />
        <button
          className="nb-round"
          data-kind="dark"
          type="submit"
          aria-label="Listeye ekle"
          disabled={busy || text.trim().length < 3}
          style={{ width: 58, height: 58, flex: "none" }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </>
  )
}
