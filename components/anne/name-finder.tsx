"use client"

import { useState } from "react"
import { KIND_LABEL, NAMES } from "@/lib/anne/content/names"
import { send } from "@/components/anne/api"

/** İsim bulucu: beğen ya da geç. Beğenilenler hesaba kaydedilir. */
export function NameFinder({ initialLiked }: { initialLiked: string[] }) {
  const [liked, setLiked] = useState<string[]>(initialLiked)
  const [index, setIndex] = useState(() => {
    const first = NAMES.findIndex((n) => !initialLiked.includes(n.name))
    return first === -1 ? 0 : first
  })
  const [showList, setShowList] = useState(false)
  const [error, setError] = useState("")

  const current = NAMES[index % NAMES.length]
  const isLiked = liked.includes(current.name)

  function next() {
    setIndex((i) => i + 1)
  }

  async function like() {
    setError("")
    if (!isLiked) {
      setLiked((prev) => [...prev, current.name])
      const result = await send("/api/anne/isimler", "POST", { name: current.name, liked: true }, "Beğeni kaydedilemedi.")
      if (!result.ok) {
        setLiked((prev) => prev.filter((n) => n !== current.name))
        setError(result.error)
        return
      }
    }
    next()
  }

  async function remove(name: string) {
    setError("")
    const before = liked
    setLiked((prev) => prev.filter((n) => n !== name))
    const result = await send("/api/anne/isimler", "POST", { name, liked: false }, "Kaldırılamadı.")
    if (!result.ok) {
      setLiked(before)
      setError(result.error)
    }
  }

  return (
    <>
      <div style={{ width: "100%", marginTop: 24 }}>
        <div className="nb-card" data-tone="lilac" style={{ margin: "0 28px", height: 40, borderRadius: "28px 28px 0 0" }} />
        <div className="nb-card" data-tone="peach" style={{ margin: "-22px 14px 0", height: 40, borderRadius: "28px 28px 0 0" }} />
        <div
          className="nb-card"
          data-tone="pink"
          style={{ marginTop: -22, minHeight: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          aria-live="polite"
        >
          <p className="nb-name">{current.name}</p>
          <p style={{ marginTop: 10, fontSize: 17 }}>Anlamı: {current.meaning}</p>
          <span className="nb-chip" style={{ marginTop: 18 }}>
            {KIND_LABEL[current.kind]}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 28, marginTop: 24 }}>
        <button className="nb-round" type="button" onClick={next} aria-label="Geç">
          <svg viewBox="0 0 24 24" aria-hidden="true" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <button className="nb-round" data-kind="dark" type="button" onClick={() => void like()} aria-label="Beğen">
          <svg viewBox="0 0 24 24" aria-hidden="true" width="30" height="30" fill="currentColor">
            <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
          </svg>
        </button>
      </div>

      {error && (
        <p className="nb-error" role="alert">
          {error}
        </p>
      )}

      <div className="nb-grow" />
      <button className="nb-btn" data-kind="light" type="button" onClick={() => setShowList((v) => !v)} aria-expanded={showList}>
        Beğendiklerim ({liked.length})
      </button>
      {showList && (
        <div className="nb-card" style={{ width: "100%", padding: "6px 18px", textAlign: "left" }}>
          {liked.length === 0 ? (
            <p className="nb-note" style={{ padding: "12px 0" }}>
              Henüz beğendiğin isim yok.
            </p>
          ) : (
            liked.map((name) => (
              <div className="nb-row" key={name}>
                <b>{name}</b>
                <button className="nb-link" type="button" onClick={() => void remove(name)}>
                  Kaldır
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </>
  )
}
