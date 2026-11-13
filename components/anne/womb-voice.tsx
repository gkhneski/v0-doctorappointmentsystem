"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { MAX_RECORD_SECONDS, OPEN_CUTOFF_HZ, WOMB_CUTOFF_HZ, renderWombWav, wombFilters } from "@/lib/anne/womb-audio"

const BARS = 14
type Phase = "idle" | "recording" | "ready"

/**
 * "Beni böyle duyuyor": anne birkaç saniye konuşur ya da ninni söyler; kayıt önce olduğu gibi,
 * sonra karnında duyulduğu gibi (tizleri süzülmüş) çalınır. Ses telefondan çıkmaz, saklanmaz.
 */
export function WombVoice({ faceUrl, science, source }: { faceUrl: string | null; science: string; source: string }) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [inside, setInside] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState("")
  const [sharing, setSharing] = useState(false)

  const context = useRef<AudioContext | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const recording = useRef<AudioBuffer | null>(null)
  const player = useRef<AudioBufferSourceNode | null>(null)
  const filters = useRef<BiquadFilterNode[]>([])
  const analyser = useRef<AnalyserNode | null>(null)
  const wave = useRef<HTMLDivElement>(null)
  const frame = useRef(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const audio = useCallback(() => {
    if (!context.current) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      context.current = new Ctor()
    }
    void context.current.resume()
    return context.current
  }, [])

  /** Ses düzeyini çubuklara yazar. */
  const draw = useCallback(() => {
    const node = analyser.current
    const bars = wave.current?.children
    if (node && bars) {
      const data = new Uint8Array(node.frequencyBinCount)
      node.getByteFrequencyData(data)
      const step = Math.max(1, Math.floor(data.length / 2 / bars.length))
      for (let i = 0; i < bars.length; i++) {
        const level = data[i * step] / 255
        ;(bars[i] as HTMLElement).style.transform = `scaleY(${Math.max(0.08, level).toFixed(2)})`
      }
    }
    frame.current = requestAnimationFrame(draw)
  }, [])

  const stopPlayer = useCallback(() => {
    try {
      player.current?.stop()
    } catch {
      // Zaten durmuş.
    }
    player.current = null
  }, [])

  const releaseMic = useCallback(() => {
    stream.current?.getTracks().forEach((track) => track.stop())
    stream.current = null
    if (timer.current) clearInterval(timer.current)
    timer.current = null
  }, [])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(frame.current)
      stopPlayer()
      releaseMic()
      void context.current?.close()
    }
  }, [releaseMic, stopPlayer])

  /** Kaydı döngüde çalar; süzgeç açık ya da kapalı. */
  const play = useCallback(
    (asInside: boolean) => {
      const buffer = recording.current
      if (!buffer) return
      const ctx = audio()
      stopPlayer()
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      const pair = wombFilters(ctx, asInside)
      const meter = ctx.createAnalyser()
      meter.fftSize = 128
      source.connect(pair[0]).connect(pair[1]).connect(meter).connect(ctx.destination)
      source.start()
      player.current = source
      filters.current = pair
      analyser.current = meter
    },
    [audio, stopPlayer],
  )

  async function start() {
    setError("")
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Bu tarayıcı ses kaydını desteklemiyor.")
      return
    }
    try {
      const ctx = audio()
      stopPlayer()
      const media = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.current = media
      const meter = ctx.createAnalyser()
      meter.fftSize = 128
      ctx.createMediaStreamSource(media).connect(meter)
      analyser.current = meter
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(draw)

      const chunks: Blob[] = []
      const rec = new MediaRecorder(media)
      rec.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }
      rec.onstop = async () => {
        releaseMic()
        try {
          const bytes = await new Blob(chunks).arrayBuffer()
          recording.current = await ctx.decodeAudioData(bytes)
          setInside(false)
          setPhase("ready")
          play(false)
        } catch {
          setPhase("idle")
          setError("Kayıt okunamadı. Lütfen yeniden dene.")
        }
      }
      recorder.current = rec
      rec.start()
      setSeconds(0)
      setPhase("recording")
      timer.current = setInterval(() => {
        setSeconds((n) => {
          if (n + 1 >= MAX_RECORD_SECONDS) stop()
          return n + 1
        })
      }, 1000)
    } catch {
      releaseMic()
      setPhase("idle")
      setError("Mikrofona izin verilmedi. Tarayıcı ayarlarından izin verip yeniden dene.")
    }
  }

  function stop() {
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop()
  }

  function choose(asInside: boolean) {
    setInside(asInside)
    const ctx = context.current
    if (!ctx || filters.current.length === 0) return
    // Geçiş yumuşak olsun diye kesim frekansı kısa sürede kaydırılır.
    for (const filter of filters.current) {
      filter.frequency.cancelScheduledValues(ctx.currentTime)
      filter.frequency.setTargetAtTime(asInside ? WOMB_CUTOFF_HZ : OPEN_CUTOFF_HZ, ctx.currentTime, 0.12)
    }
  }

  async function share() {
    if (!recording.current) return
    setSharing(true)
    setError("")
    try {
      const blob = await renderWombWav(recording.current)
      const file = new File([blob], "karnindan-sesim.wav", { type: "audio/wav" })
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] })
        } catch {
          // Paylaşım iptal edildi.
        }
      } else {
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = file.name
        link.click()
        setTimeout(() => URL.revokeObjectURL(link.href), 10_000)
      }
    } catch {
      setError("Ses hazırlanamadı. Lütfen yeniden dene.")
    }
    setSharing(false)
  }

  return (
    <>
      {faceUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="nb-reel-media" data-inside={inside ? "" : undefined} src={faceUrl} alt="" />
      )}
      <div className="nb-reel-shade" />
      <div className="nb-reel-body">
        <h1>{phase === "ready" ? (inside ? "Bebeğin böyle duyuyor" : "Senin duyduğun hâli") : "Bir ninni söyle"}</h1>
        <p style={{ marginTop: 6 }}>
          {phase === "idle" && "Birkaç saniye konuş ya da ninni söyle. Sonra sesinin karnında nasıl duyulduğunu dinle."}
          {phase === "recording" && `Kaydediliyor… ${seconds} / ${MAX_RECORD_SECONDS} sn. Bitince düğmeye dokun.`}
          {phase === "ready" && (inside ? "Tiz sesler süzüldü; geriye sesinin ezgisi ve ritmi kaldı." : "Şimdi “Karnından”a dokun.")}
        </p>

        <div className="nb-wave" ref={wave} data-inside={inside ? "" : undefined} aria-hidden="true">
          {Array.from({ length: BARS }, (_, i) => (
            <i key={i} />
          ))}
        </div>

        {phase === "ready" ? (
          <>
            <div className="nb-reel-seg" role="group" aria-label="Dinleme şekli">
              <button type="button" aria-pressed={!inside} onClick={() => choose(false)}>
                Dışarıdan
              </button>
              <button type="button" aria-pressed={inside} onClick={() => choose(true)}>
                Karnından
              </button>
            </div>
            <button className="nb-btn" type="button" disabled={sharing} onClick={() => void share()}>
              {sharing ? "Hazırlanıyor" : "Karnındaki hâlini paylaş"}
            </button>
            <button className="nb-btn" data-kind="light" type="button" style={{ marginTop: 8 }} onClick={() => void start()}>
              Yeniden kaydet
            </button>
          </>
        ) : (
          <button
            className="nb-rec"
            type="button"
            data-on={phase === "recording" ? "" : undefined}
            onClick={() => (phase === "recording" ? stop() : void start())}
            aria-label={phase === "recording" ? "Kaydı bitir" : "Kaydı başlat"}
          >
            <i />
          </button>
        )}

        {error && (
          <p className="nb-error" role="alert">
            {error}
          </p>
        )}

        <div className="nb-science">
          <b>Bilim ne diyor?</b> {science}
          <small>Kaynak: {source}. Ses telefonundan çıkmaz ve saklanmaz.</small>
        </div>
      </div>
    </>
  )
}
