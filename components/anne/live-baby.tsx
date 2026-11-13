"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { useRouter } from "next/navigation"
import { send } from "@/components/anne/api"
import { AccessoryArt, LookLayer, renderLook, useImageRatio } from "@/components/anne/baby-look"
import { MOMENTS, momentOf, type MomentKind } from "@/lib/anne/animation/moments"
import { accessoryOf, clampLookItem, placed, trayOrder, MAX_LOOK_ITEMS, type LookItem, type Theme } from "@/lib/anne/look"

export type LiveMoment = { id: string; kind: MomentKind; status: "processing" | "ready"; day: string }
export type LiveState = {
  face: { id: string; week: number | null } | null
  moments: LiveMoment[]
  canOpen: boolean
  next: MomentKind | null
  total: number
}

/** "Süsle"nin durumu (sunucudaki LookState ile aynı alanlar). */
export type LookState = {
  theme: Theme
  items: LookItem[]
  unlocked: string[]
  giftReady: boolean
  giftsLeft: number
  total: number
}

const POLL_MS = 2500
const WORD_MS = 3800
const WAITING = ["Bebeğin uyanıyor", "Minik bir hareket geliyor", "Az kaldı", "Neredeyse hazır"]
const TAPS = ["Agu!", "Hihi!", "Buradayım anne!", "Bir daha!", "Mmm…"]
const MUTE_KEY = "anne-canli-sessiz"

type Heart = { id: number; x: number; y: number }
type Box = { left: number; top: number; width: number; height: number }
type Gesture =
  | { mode: "drag"; id: string; from: LookItem; x: number; y: number }
  | { mode: "pinch"; id: string; from: LookItem; distance: number; angle: number }

const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  left: 6 + ((i * 37) % 88),
  delay: (i % 6) * 0.07,
  turn: (i * 73) % 360,
  tone: ["var(--pink)", "var(--lilac)", "var(--peach)", "#f4c542"][i % 4],
}))

/**
 * Üretilmiş bebek yüzü: dokununca tepki verir, her gün yeni bir an açılır, anneye bir şeyler söyler.
 * Anne yüze aksesuar takabilir ("Süsle"); her gün yeni bir aksesuar hediye olarak açılır.
 */
export function LiveBaby({ initial, words, look: initialLook }: { initial: LiveState; words: string[]; look: LookState }) {
  const router = useRouter()
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
  const [look, setLook] = useState(initialLook)
  const [items, setItems] = useState<LookItem[]>(initialLook.items)
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [giftBusy, setGiftBusy] = useState(false)
  const [burst, setBurst] = useState(0)
  const [box, setBox] = useState<Box | null>(null)
  const video = useRef<HTMLVideoElement>(null)
  const stage = useRef<HTMLButtonElement>(null)
  const wordIndex = useRef(0)
  const lastPlayed = useRef<string | null>(null)
  const heartId = useRef(0)
  const quietUntil = useRef(0)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<Gesture | null>(null)
  const dirty = useRef(false)
  const { ref: faceRef, ratio, onLoad: onFaceLoad } = useImageRatio()

  const ready = state.moments.filter((m) => m.status === "ready")
  const processing = state.moments.find((m) => m.status === "processing") ?? null
  const face = state.face
  const tray = useMemo(() => trayOrder(look.theme, look.unlocked), [look.theme, look.unlocked])

  useEffect(() => {
    try {
      setMuted(localStorage.getItem(MUTE_KEY) === "1")
    } catch {
      // Depolama kapalıysa ses açık kalır.
    }
  }, [])

  // Resim sahneyi kırparak doldurur; aksesuar katmanı resmin tamamının kutusuna oturtulur.
  useEffect(() => {
    const element = stage.current
    if (!element || !ratio) return
    const measure = () => {
      const width = element.clientWidth
      const height = element.clientHeight
      if (width === 0 || height === 0) return
      const boxHeight = Math.max(height, width / ratio)
      const boxWidth = boxHeight * ratio
      setBox({ left: (width - boxWidth) / 2, top: (height - boxHeight) / 2, width: boxWidth, height: boxHeight })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ratio])

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
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
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

  // ---- Süsle ----

  function change(id: string, update: (item: LookItem) => LookItem) {
    dirty.current = true
    setItems((prev) => prev.map((item) => (item.item === id ? clampLookItem(update(item)) : item)))
  }

  /** Şeritten aksesuar seçimi: takılı değilse takar; her durumda düzenlemeye geçer. */
  function pick(id: string) {
    setError("")
    if (!items.some((item) => item.item === id)) {
      const fresh = placed(id)
      if (!fresh) return
      if (items.length >= MAX_LOOK_ITEMS) {
        setError(`En fazla ${MAX_LOOK_ITEMS} aksesuar takılabilir. Önce birini çıkar.`)
        return
      }
      dirty.current = true
      setItems((prev) => [...prev, fresh])
    }
    setSelected(id)
    setEditing(true)
  }

  function takeOff(id: string) {
    dirty.current = true
    setItems((prev) => prev.filter((item) => item.item !== id))
    setSelected(null)
  }

  async function finish() {
    if (dirty.current) {
      setSaving(true)
      const result = await send<{ items: LookItem[] }>("/api/anne/sus", "PUT", { items }, "Kaydedilemedi. Lütfen yeniden dene.")
      setSaving(false)
      if (!result.ok) {
        setError(result.error)
        return
      }
      dirty.current = false
      setItems(result.data.items)
      // Ana ekrandaki yüz de yeni haliyle görünsün.
      router.refresh()
    }
    pointers.current.clear()
    gesture.current = null
    setSelected(null)
    setEditing(false)
    say(items.length > 0 ? "Nasıl olmuşum?" : "Agu!")
  }

  async function openGift() {
    setGiftBusy(true)
    setError("")
    const result = await send<{ item: string; state: LookState }>("/api/anne/sus", "POST", {}, "Hediye açılamadı. Lütfen yeniden dene.")
    setGiftBusy(false)
    if (!result.ok) {
      setError(result.error)
      const fresh = await send<LookState>("/api/anne/sus", "GET")
      if (fresh.ok) setLook(fresh.data)
      return
    }
    setLook(result.data.state)
    setBurst((n) => n + 1)
    say(`Yeni hediyem: ${accessoryOf(result.data.item)?.label ?? "sürpriz"}!`)
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([12, 60, 12])
    pick(result.data.item)
  }

  /** Dokunulan yerin sahnedeki konumu. */
  function point(event: React.PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  /** Dokunulan yerdeki aksesuar (üstteki önce); yoksa null. */
  function hit(at: { x: number; y: number }): LookItem | null {
    if (!box) return null
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i]
      const dx = at.x - (box.left + item.x * box.width)
      const dy = at.y - (box.top + item.y * box.height)
      if (Math.hypot(dx, dy) <= Math.max(item.size * box.width * 0.6, 30)) return item
    }
    return null
  }

  /** Ekrandaki parmak sayısına göre hareketi yeniden başlatır: bir parmak taşır, iki parmak büyütür ve çevirir. */
  function startGesture(id: string | null) {
    const active = [...pointers.current.values()]
    const item = items.find((entry) => entry.item === id)
    if (!item || active.length === 0) {
      gesture.current = null
      return
    }
    if (active.length === 1) {
      gesture.current = { mode: "drag", id: item.item, from: item, x: active[0].x, y: active[0].y }
      return
    }
    const [a, b] = active
    gesture.current = {
      mode: "pinch",
      id: item.item,
      from: item,
      distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)),
      angle: Math.atan2(b.y - a.y, b.x - a.x),
    }
  }

  function editDown(event: React.PointerEvent<HTMLButtonElement>) {
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Yakalama desteklenmiyorsa hareket yine sahnenin içinde izlenir.
    }
    const at = point(event)
    pointers.current.set(event.pointerId, at)
    if (pointers.current.size === 1) {
      const target = hit(at)
      setSelected(target ? target.item : null)
      startGesture(target ? target.item : null)
      return
    }
    startGesture(gesture.current?.id ?? selected)
  }

  function editMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!pointers.current.has(event.pointerId) || !box) return
    pointers.current.set(event.pointerId, point(event))
    const current = gesture.current
    if (!current) return
    const active = [...pointers.current.values()]
    if (current.mode === "drag") {
      const dx = (active[0].x - current.x) / box.width
      const dy = (active[0].y - current.y) / box.height
      change(current.id, () => ({ ...current.from, x: current.from.x + dx, y: current.from.y + dy }))
    } else if (active.length >= 2) {
      const [a, b] = active
      const scale = Math.hypot(b.x - a.x, b.y - a.y) / current.distance
      const turn = ((Math.atan2(b.y - a.y, b.x - a.x) - current.angle) * 180) / Math.PI
      change(current.id, () => ({ ...current.from, size: current.from.size * scale, rot: current.from.rot + turn }))
    }
  }

  function editUp(event: React.PointerEvent<HTMLButtonElement>) {
    pointers.current.delete(event.pointerId)
    startGesture(gesture.current?.id ?? null)
  }

  async function shareLook() {
    if (!face) return
    setError("")
    try {
      const blob = await renderLook(`/api/anne/canli?yuz=${face.id}`, items)
      if (!blob) throw new Error("çizilemedi")
      const file = new File([blob], "bebegim.jpg", { type: "image/jpeg" })
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] })
        } catch {
          // Paylaşım iptal edildi.
        }
        return
      }
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = "bebegim.jpg"
      link.click()
      setTimeout(() => URL.revokeObjectURL(link.href), 10_000)
    } catch {
      setError("Resim hazırlanamadı. Lütfen yeniden dene.")
    }
  }

  // ---- Anlar ----

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
  const locked = Boolean(playing) || Boolean(processing)

  return (
    <>
      <div className="nb-baby">
        <p className="nb-baby-bubble" key={bubble} aria-live="polite" style={editing ? { visibility: "hidden" } : undefined}>
          {bubble}
        </p>
        <button
          ref={stage}
          className="nb-baby-stage"
          type="button"
          data-edit={editing ? "" : undefined}
          onPointerDown={editing ? editDown : touch}
          onPointerMove={editing ? editMove : undefined}
          onPointerUp={editing ? editUp : undefined}
          onPointerCancel={editing ? editUp : undefined}
          aria-label={editing ? "Aksesuarı sürükleyerek yerleştir" : "Bebeğine dokun"}
        >
          <span className="nb-baby-still" data-bump={bump === 0 ? undefined : bump % 2 ? "a" : "b"}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={faceRef} onLoad={onFaceLoad} className="nb-baby-face" src={`/api/anne/canli?yuz=${face.id}`} alt="Bebeğinin yüzü" draggable={false} />
            {box && items.length > 0 && (
              <LookLayer items={items} selected={editing ? selected : null} hidden={Boolean(playing)} style={box as CSSProperties} />
            )}
          </span>
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
          {burst > 0 && (
            <span className="nb-confetti" key={burst} aria-hidden="true">
              {CONFETTI.map((piece, index) => (
                <i key={index} style={{ left: `${piece.left}%`, background: piece.tone, animationDelay: `${piece.delay}s`, rotate: `${piece.turn}deg` }} />
              ))}
            </span>
          )}
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
        {editing
          ? "Parmağınla sürükle. İki parmakla büyüt, küçült, çevir."
          : ready.length === 0
            ? "Bebeğine dokun. Bugünün sürprizini açınca hareket etmeye başlar."
            : "Bebeğine dokun, sana tepki versin."}
      </p>

      {editing && (
        <div className="nb-acc-tools">
          <button type="button" disabled={!selected} onClick={() => selected && change(selected, (item) => ({ ...item, size: item.size / 1.15 }))}>
            Küçült
          </button>
          <button type="button" disabled={!selected} onClick={() => selected && change(selected, (item) => ({ ...item, size: item.size * 1.15 }))}>
            Büyüt
          </button>
          <button type="button" disabled={!selected} onClick={() => selected && change(selected, (item) => ({ ...item, rot: item.rot + 15 }))}>
            Çevir
          </button>
          <button type="button" disabled={!selected} onClick={() => selected && takeOff(selected)}>
            Çıkar
          </button>
          <button type="button" data-kind="done" disabled={saving} onClick={() => void finish()}>
            {saving ? "Kaydediliyor" : "Bitti"}
          </button>
        </div>
      )}

      <div className="nb-head" style={{ marginTop: 18 }}>
        <h3>Süsle</h3>
        <span className="nb-note">
          {look.unlocked.length} / {look.total} aksesuar
        </span>
      </div>
      <div className="nb-tray">
        {look.giftsLeft > 0 && (
          <button className="nb-acc" data-gift={look.giftReady ? "ready" : "wait"} type="button" disabled={!look.giftReady || giftBusy || locked} onClick={() => void openGift()}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <rect x="14" y="40" width="72" height="50" rx="8" fill="var(--pink)" stroke="var(--ink)" strokeWidth="5" />
              <rect x="8" y="26" width="84" height="20" rx="7" fill="var(--card)" stroke="var(--ink)" strokeWidth="5" />
              <path d="M50 26v64M50 26C40 6 20 12 30 24M50 26C60 6 80 12 70 24" fill="none" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" />
            </svg>
            <span>{look.giftReady ? (giftBusy ? "Açılıyor" : "Hediyeni aç") : "Yenisi yarın"}</span>
          </button>
        )}
        {tray.map((accessory) => (
          <button
            key={accessory.id}
            className="nb-acc"
            type="button"
            disabled={locked}
            aria-pressed={items.some((item) => item.item === accessory.id)}
            data-selected={editing && selected === accessory.id ? "" : undefined}
            onClick={() => pick(accessory.id)}
          >
            <AccessoryArt accessory={accessory} />
            <span>{accessory.label}</span>
          </button>
        ))}
      </div>

      {items.length > 0 && !editing && (
        <button className="nb-btn" data-kind="light" type="button" onClick={() => void shareLook()}>
          Süslü halini paylaş
        </button>
      )}

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
              disabled={!moment || Boolean(playing) || editing}
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
        <button className="nb-btn" type="button" disabled={busy || editing} onClick={() => void open()}>
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
