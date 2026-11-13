"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import type { Myth } from "@/lib/anne/content/myths"

const SWIPE = 80
const CONFETTI = Array.from({ length: 16 }, (_, i) => ({ left: 5 + ((i * 41) % 90), delay: (i % 5) * 0.08 }))

/**
 * "Doğru mu, efsane mi?": kart sağa kaydırılırsa "doğru", sola kaydırılırsa "efsane" denmiş olur;
 * alttaki düğmeler de aynı işi görür. Yanıttan sonra açıklama ve kaynağı görünür.
 */
export function MythDeck({ myths, sources }: { myths: Myth[]; sources: Record<string, string> }) {
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [drag, setDrag] = useState(0)
  const startX = useRef<number | null>(null)

  const done = index >= myths.length
  const myth = done ? null : myths[index]
  const right = myth !== null && answer === myth.truth

  function reply(value: boolean) {
    if (!myth || answer !== null) return
    setAnswer(value)
    setDrag(0)
    if (value === myth.truth) {
      setScore((n) => n + 1)
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(14)
    }
  }

  function next() {
    setAnswer(null)
    setIndex((n) => n + 1)
  }

  function down(event: React.PointerEvent<HTMLDivElement>) {
    // Düğmeye basılıyorsa kaydırma başlamaz; yoksa yakalama dokunuşu düğmeden alır.
    if (answer !== null || (event.target as HTMLElement).closest("button")) return
    startX.current = event.clientX
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Yakalama desteklenmiyorsa kaydırma kartın içinde izlenir.
    }
  }

  function move(event: React.PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return
    setDrag(event.clientX - startX.current)
  }

  function up() {
    if (startX.current === null) return
    startX.current = null
    if (drag > SWIPE) reply(true)
    else if (drag < -SWIPE) reply(false)
    else setDrag(0)
  }

  return (
    <>
      <div className="nb-steps" aria-hidden="true">
        {myths.map((item, i) => (
          <i key={item.id} data-on={i < index || (i === index && answer !== null) ? "" : undefined} />
        ))}
      </div>

      {myth && answer !== null && right && (
        <span className="nb-confetti" key={`konfeti-${myth.id}`} aria-hidden="true">
          {CONFETTI.map((piece, i) => (
            <i key={i} style={{ left: `${piece.left}%`, animationDelay: `${piece.delay}s` }} />
          ))}
        </span>
      )}

      {myth ? (
        <>
          <div
            key={myth.id}
            className="nb-myth"
            data-idle={answer === null ? "" : undefined}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            style={drag ? { transform: `translateX(${drag}px) rotate(${drag / 22}deg)`, animation: "none" } : undefined}
          >
            <small>
              {index + 1} / {myths.length}
            </small>
            <h1>{myth.text}</h1>
            {answer === null ? (
              <div className="nb-myth-answers">
                <button type="button" onClick={() => reply(false)}>
                  Efsane
                </button>
                <button type="button" data-kind="accent" onClick={() => reply(true)}>
                  Doğru
                </button>
              </div>
            ) : (
              <div aria-live="polite">
                <span className="nb-myth-verdict" data-ok={right ? "" : undefined}>
                  {right ? "Bildin!" : "Bu sefer olmadı"} · {myth.truth ? "Doğru" : "Efsane"}
                </span>
                <p style={{ marginTop: 10, fontSize: 16, lineHeight: 1.4 }}>{myth.explanation}</p>
                <p className="nb-note" style={{ marginTop: 8, fontSize: 11 }}>
                  Kaynak: {sources[myth.source]}.
                </p>
              </div>
            )}
          </div>
          <div className="nb-reel-body" style={{ flex: "none" }}>
            {answer === null ? (
              <p className="nb-note" style={{ textAlign: "center" }}>
                Kartı sağa kaydır: doğru. Sola kaydır: efsane.
              </p>
            ) : (
              <button className="nb-btn" data-kind="light" type="button" style={{ marginTop: 0 }} onClick={next}>
                {index + 1 < myths.length ? "Sıradaki kart" : "Sonucu gör"}
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="nb-reel-body">
          <p className="nb-count" style={{ marginTop: 0 }}>
            {score}/{myths.length}
          </p>
          <h1 style={{ marginTop: 10 }}>{score === myths.length ? "Hepsini bildin!" : score >= 3 ? "Çok iyi gidiyorsun." : "Yarın yine dene."}</h1>
          <p style={{ marginTop: 8 }}>Bugünün kartları bitti. Yarın beş yeni kart gelir.</p>
          <Link className="nb-btn" data-kind="light" href="/anne/oyun">
            Oyunlara dön
          </Link>
        </div>
      )}
    </>
  )
}
