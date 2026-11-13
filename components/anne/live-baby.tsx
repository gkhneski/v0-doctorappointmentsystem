"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { send } from "@/components/anne/api"
import { MOMENTS, momentOf, type MomentKind } from "@/lib/anne/animation/moments"

export type LiveMoment = { id: string; kind: MomentKind; status: "processing" | "ready"; day: string }
export type LiveState = {
  face: { id: string; week: number | null } | null
  moments: LiveMoment[]
  canOpen: boolean
  next: MomentKind | null
  total: number
}

const POLL_MS = 2500
const WORD_MS = 3800
const WAITING = ["Bebeğin uyanıyor", "Minik bir hareket geliyor", "Az kaldı", "Neredeyse hazır"]
const TAPS = ["Agu!", "Hihi!", "Buradayım anne!", "Bir daha!", "Mmm…"]
const MUTE_KEY = "anne-canli-sessiz"

type Heart = { id: number; x: number; y: number }

/** Üretilmiş bebek yüzü: dokununca tepki verir, her gün yeni bir an açılır, anneye bir şeyler söyler. */
export function LiveBaby({ initial, words }: { initial: LiveState; words: string[] }) {
  const [state, setState] = useState(initial)
  const [playing, setPlaying] = useState<string | null>(null)
  const [bubble, setBubble] = useState(words[0] ?? "Merhaba anne!")
  const [hearts, setHearts] = useState<Heart[]>([])
  const [bump, setBump] = useState(0)
  const [muted, setMuted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [waitStep, setWaitStep] = useState(0)
  const [justOpened, setJustOpened] = useState<string | null>(null)
  const video = useRef<HTMLVideoElement>(null)
  const wordIndex = useRef(0)
  const lastPlayed = useRef<string | null>(null)
  const heartId = useRef(0)
  const quietUntil = useRef(0)

  const ready = state.moments.filter((m) => m.status === "ready")
  const processing = state.moments.find((m) => m.status === "processing") ?? null
  const face = state.face

  useEffect(() => {
    try {
      setMuted(localStorage.getItem(MUTE_KEY) === "1")
    } catch {
      // Depolama kapalıysa ses açık kalır.
    }
  }, [])

  // Günün sözleri sırayla döner; dokunuşun yazdığı söz birkaç saniye ekranda kalır.
  useEffect(() => {
    if (words.length < 2) return
    const timer = setInterval(() => {
      if (Date.now() < quietUntil.current) return
      wordIndex.current = (wordIndex.current + 1) % words.length
      setBubble(words[wordIndex.current])
    }, WORD_MS)
    return () => clearInterval(timer)
  }, [words])

  const say = useCallback((text: string) => {
    quietUntil.current = Date.now() + 3200
    setBubble(text)
  }, [])

  const play = useCallback(
    (moment: LiveMoment) => {
      const element = video.current
      if (!element) return
      lastPlayed.current = moment.id
      setPlaying(moment.id)
      say(momentOf(moment.kind).sound)
      element.src = `/api/anne/canli?klip=${moment.id}`
      element.muted = muted
      element.currentTime = 0
      void element.play().catch(() => {
        // Tarayıcı sesi engellediyse sessiz oynat.
        element.muted = true
        void element.play().catch(() => setPlaying(null))
      })
    },
    [muted, say],
  )

  // Yeni an hazırlanırken durum yoklanır; hazır olunca kendiliğinden oynar.
  useEffect(() => {
    if (!processing) return
    const steps = setInterval(() => setWaitStep((s) => (s + 1) % WAITING.length), 6000)
    const poll = setInterval(async () => {
      const result = await send<LiveState>("/api/anne/canli", "GET")
      if (!result.ok) return
      setState(result.data)
      const done = result.data.moments.find((m) => m.id === processing.id)
      if (!done) setError("Bugünün anı hazırlanamadı. Biraz sonra yeniden dene.")
      else if (done.status === "ready") {
        setJustOpened(done.id)
        play(done)
      }
    }, POLL_MS)
    return () => {
      clearInterval(steps)
      clearInterval(poll)
    }
  }, [processing, play])

  function touch(event: React.PointerEvent<HTMLButtonElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - box.left) / box.width) * 100
    const y = ((event.clientY - box.top) / box.height) * 100
    const id = ++heartId.current
    setHearts((prev) => [...prev.slice(-8), { id, x, y }])
    setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 1300)
    setBump((n) => n + 1)
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(12)

    if (playing) return
    if (ready.length === 0) {
      say(TAPS[id % TAPS.length])
      return
    }
    // Aynı an art arda gelmesin.
    const pool = ready.length > 1 ? ready.filter((m) => m.id !== lastPlayed.current) : ready
    play(pool[id % pool.length])
  }

  async function open() {
    setBusy(true)
    setError("")
    const result = await send<{ moment: LiveMoment }>("/api/anne/canli", "POST", {}, "Bugünün anı başlatılamadı.")
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      const fresh = await send<LiveState>("/api/anne/canli", "GET")
      if (fresh.ok) setState(fresh.data)
      return
    }
    setWaitStep(0)
    setState((prev) => ({
      ...prev,
      canOpen: false,
      moments: [...prev.moments, { ...result.data.moment, day: "" }],
    }))
  }

  function toggleSound() {
    const next = !muted
    setMuted(next)
    if (video.current) video.current.muted = next
    try {
      localStorage.setItem(MUTE_KEY, next ? "1" : "0")
    } catch {
      // Depolama kapalıysa tercih yalnızca bu ekranda geçerlidir.
    }
  }

  async function share(moment: LiveMoment) {
    const url = `/api/anne/canli?klip=${moment.id}`
    try {
      const blob = await (await fetch(url)).blob()
      const file = new File([blob], "bebegim.mp4", { type: "video/mp4" })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] })
        return
      }
    } catch {
      // Paylaşım iptal edildiyse ya da desteklenmiyorsa indirmeye düşülür.
    }
    const link = document.createElement("a")
    link.href = url
    link.download = "bebegim.mp4"
    link.click()
  }

  if (!face) return null
  const current = ready.find((m) => m.id === (playing ?? lastPlayed.current)) ?? null

  return (
    <>
      <div className="nb-baby">
        <p className="nb-baby-bubble" key={bubble} aria-live="polite">
          {bubble}
        </p>
        <button className="nb-baby-stage" type="button" onPointerDown={touch} aria-label="Bebeğine dokun">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="nb-baby-face" data-bump={bump === 0 ? undefined : bump % 2 ? "a" : "b"} src={`/api/anne/canli?yuz=${face.id}`} alt="Bebeğinin yüzü" draggable={false} />
          <video
            ref={video}
            className="nb-baby-video"
            data-on={playing ? "" : undefined}
            playsInline
            preload="none"
            onEnded={() => setPlaying(null)}
            onError={() => setPlaying(null)}
          />
          {hearts.map((heart) => (
            <span key={heart.id} className="nb-baby-heart" style={{ left: `${heart.x}%`, top: `${heart.y}%` }} aria-hidden="true">
              ♥
            </span>
          ))}
          {processing && (
            <span className="nb-baby-wait">
              <span className="nb-face-orb" style={{ width: 84, height: 84 }}>
                <i />
                <i style={{ inset: 12 }} />
                <i style={{ inset: 26 }} />
              </span>
              {WAITING[waitStep]}
            </span>
          )}
        </button>
        <button className="nb-baby-sound" type="button" onClick={toggleSound} aria-pressed={!muted} aria-label={muted ? "Sesi aç" : "Sesi kapat"}>
          {muted ? "Ses kapalı" : "Ses açık"}
        </button>
      </div>

      <p className="nb-note" style={{ marginTop: 10, textAlign: "center" }}>
        {ready.length === 0 ? "Bebeğine dokun. Bugünün sürprizini açınca hareket etmeye başlar." : "Bebeğine dokun, sana tepki versin."}
      </p>

      <div className="nb-head" style={{ marginTop: 18 }}>
        <h3>Anlar</h3>
        <span className="nb-note">
          {ready.length} / {state.total}
        </span>
      </div>
      <div className="nb-cats">
        {MOMENTS.map((item) => {
          const moment = ready.find((m) => m.kind === item.kind)
          return (
            <button
              key={item.kind}
              className="nb-cat"
              data-tone={moment ? "pink" : undefined}
              data-new={moment && moment.id === justOpened ? "" : undefined}
              type="button"
              disabled={!moment || Boolean(playing)}
              aria-pressed={Boolean(moment && playing === moment.id)}
              onClick={() => moment && play(moment)}
              aria-label={moment ? `${item.label} anını oynat` : "Henüz açılmamış an"}
            >
              {moment ? item.label : "?"}
            </button>
          )
        })}
      </div>

      {error && (
        <p className="nb-error" role="alert">
          {error}
        </p>
      )}

      {processing ? (
        <button className="nb-btn" type="button" disabled>
          Bugünün anı hazırlanıyor (yaklaşık yarım dakika)
        </button>
      ) : state.canOpen ? (
        <button className="nb-btn" type="button" disabled={busy} onClick={() => void open()}>
          {busy ? "Başlıyor" : "Bugünün sürprizini aç"}
        </button>
      ) : state.next ? (
        <div className="nb-card" data-tone="lilac" style={{ textAlign: "center" }}>
          <b>Yeni an yarın açılır.</b> Yarın yine gel, bebeğin sana yeni bir şey gösterecek.
        </div>
      ) : (
        <div className="nb-card" data-tone="lilac" style={{ textAlign: "center" }}>
          <b>Bütün anları topladın.</b> İstediğin zaman dokun, oynasın.
        </div>
      )}

      {current && !processing && (
        <button className="nb-btn" data-kind="light" type="button" onClick={() => void share(current)}>
          {momentOf(current.kind).label} anını paylaş
        </button>
      )}

      <p className="nb-note" style={{ marginTop: 18, textAlign: "center", fontSize: 13 }}>
        Yapay zekâ ile üretilmiş bir canlandırmadır; bebeğinin gerçek hareketi ya da tıbbi görüntü değildir.
      </p>
    </>
  )
}
