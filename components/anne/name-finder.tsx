"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { KIND_LABEL, NAMES, namesFor, type BabyName, type NameFilter } from "@/lib/anne/content/names"
import { send } from "@/components/anne/api"

const FILTERS: { id: NameFilter; label: string }[] = [
  { id: "kiz", label: "Kız" },
  { id: "erkek", label: "Erkek" },
  { id: "hepsi", label: "Hepsi" },
]
/** Çark dönerken iki isim arasındaki süre (ms). */
const SPIN_MS = 70
/** Durdurulduktan sonra çark kaç adımda yavaşlayıp durur. */
const SLOW_STEPS = 9

type Phase = "idle" | "spinning" | "slowing" | "stopped"

function pickIndex(length: number, not: number): number {
  if (length < 2) return 0
  let next = Math.floor(Math.random() * length)
  if (next === not) next = (next + 1) % length
  return next
}

/**
 * İsim çarkı: isimler sayaç gibi hızla döner, anne düğmeye basınca yavaşlayıp birinde durur;
 * ismin anlamı ve kökeni görünür. Beğenilen isimler hesaba kaydedilir.
 */
export function NameFinder({ initialLiked, initialFilter }: { initialLiked: string[]; initialFilter: NameFilter }) {
  const [filter, setFilter] = useState<NameFilter>(initialFilter)
  const [liked, setLiked] = useState<string[]>(initialLiked)
  const [phase, setPhase] = useState<Phase>("idle")
  const [index, setIndex] = useState(0)
  const [showList, setShowList] = useState(false)
  const [error, setError] = useState("")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pool = useMemo(() => namesFor(filter), [filter])
  const current: BabyName = pool[index % pool.length]
  const before = pool[(index - 1 + pool.length) % pool.length]
  const after = pool[(index + 1) % pool.length]
  const isLiked = liked.includes(current.name)
  const moving = phase === "spinning" || phase === "slowing"

  const clear = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }
  useEffect(() => clear, [])

  function spin() {
    clear()
    setError("")
    // Hareketi azalt ayarı açıksa çark dönmez; doğrudan bir isim gelir.
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIndex((i) => pickIndex(pool.length, i))
      setPhase("stopped")
      return
    }
    setPhase("spinning")
    const tick = () => {
      setIndex((i) => pickIndex(pool.length, i))
      timer.current = setTimeout(tick, SPIN_MS)
    }
    tick()
  }

  function stop() {
    clear()
    setPhase("slowing")
    let step = 0
    const tick = () => {
      setIndex((i) => pickIndex(pool.length, i))
      step += 1
      if (step >= SLOW_STEPS) {
        setPhase("stopped")
        if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([10, 40, 18])
        return
      }
      // Her adım bir öncekinden uzun sürer; çark yavaşlayarak durur.
      timer.current = setTimeout(tick, SPIN_MS + step * step * 9)
    }
    tick()
  }

  function choose(next: NameFilter) {
    clear()
    setFilter(next)
    setIndex(0)
    setPhase("idle")
  }

  async function toggleLike(name: string, value: boolean) {
    setError("")
    const previous = liked
    setLiked((list) => (value ? [...list.filter((n) => n !== name), name] : list.filter((n) => n !== name)))
    const result = await send("/api/anne/isimler", "POST", { name, liked: value }, value ? "Beğeni kaydedilemedi." : "Kaldırılamadı.")
    if (!result.ok) {
      setLiked(previous)
      setError(result.error)
    }
  }

  return (
    <>
      <div className="nb-seg" role="group" aria-label="Kimin için isim" style={{ width: "100%", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        {FILTERS.map((item) => (
          <button key={item.id} type="button" aria-pressed={filter === item.id} disabled={moving} onClick={() => choose(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="nb-wheel" data-phase={phase} aria-live={phase === "stopped" ? "polite" : "off"}>
        <span className="nb-wheel-side" aria-hidden="true">
          {phase === "idle" ? "" : before.name}
        </span>
        <p className="nb-wheel-name" key={phase === "stopped" ? `son-${current.name}` : "donuyor"}>
          {phase === "idle" ? "?" : current.name}
        </p>
        <span className="nb-wheel-side" aria-hidden="true">
          {phase === "idle" ? "" : after.name}
        </span>
      </div>

      <div className="nb-wheel-info">
        {phase === "stopped" ? (
          <>
            <p style={{ fontSize: 18, lineHeight: 1.35 }}>
              <b>Anlamı:</b> {current.meaning}
            </p>
            <p style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginTop: 12 }}>
              <span className="nb-chip">{KIND_LABEL[current.kind]}</span>
              {current.origin && <span className="nb-chip">Köken: {current.origin}</span>}
            </p>
          </>
        ) : (
          <p className="nb-note" style={{ fontSize: 15 }}>
            {phase === "idle" ? `${pool.length} isim hazır. Çarkı çevir, istediğin anda durdur.` : "İsimler dönüyor. Durdur, bakalım hangisi çıkacak."}
          </p>
        )}
      </div>

      {phase === "stopped" ? (
        <div style={{ display: "flex", gap: 8, width: "100%" }}>
          <button className="nb-btn" data-kind="light" type="button" style={{ flex: 1 }} onClick={spin}>
            Yeniden çevir
          </button>
          <button className="nb-btn" data-kind="accent" type="button" style={{ flex: 1 }} aria-pressed={isLiked} onClick={() => void toggleLike(current.name, !isLiked)}>
            {isLiked ? "Beğenildi" : "Beğen"}
          </button>
        </div>
      ) : (
        <button className="nb-btn" data-kind={phase === "idle" ? undefined : "accent"} type="button" disabled={phase === "slowing"} onClick={phase === "spinning" ? stop : spin}>
          {phase === "idle" ? "Çarkı çevir" : phase === "spinning" ? "Durdur" : "Duruyor"}
        </button>
      )}

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
                <span style={{ minWidth: 0 }}>
                  <b style={{ color: "var(--ink)" }}>{name}</b>
                  <span className="nb-note" style={{ display: "block", fontSize: 13 }}>
                    {NAMES.find((n) => n.name === name)?.meaning}
                  </span>
                </span>
                <button className="nb-link" type="button" onClick={() => void toggleLike(name, false)}>
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
