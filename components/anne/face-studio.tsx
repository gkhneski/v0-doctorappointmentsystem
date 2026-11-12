"use client"

import { useEffect, useRef, useState } from "react"
import { send } from "@/components/anne/api"

export type FaceItem = { id: string; status: "processing" | "generated" | "failed"; week: number | null; createdAt: string; error: string | null }
export type FaceState = {
  minWeek: number
  allowance: { total: number; used: number; remaining: number; processing: boolean }
  draft: { papers: number; measurements: number }
  items: FaceItem[]
}

const MAX_BYTES = 4 * 1024 * 1024
const POLL_MS = 2500
const WAITING = ["Görüntü inceleniyor", "Bebeğin yüzü öne çevriliyor", "Ayrıntılar netleştiriliyor", "Çerçeve hazırlanıyor"]

/**
 * Fotoğrafı eski sistemin yaptığı gibi hazırlar: genişlik 2000 pikseli aşıyorsa küçültür,
 * JPEG (kalite 0.90) olarak kaydeder. Konum bilgisi de böylece silinir.
 */
async function prepare(file: File, maxWidth = 2000): Promise<Blob | null> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("açılamadı"))
      img.src = url
    })
    let { width, height } = img
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width)
      width = maxWidth
    }
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")
    if (!context) return null
    context.drawImage(img, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9))
    // Yükleme sınırını aşan nadir fotoğraf bir kez daha, daha dar hazırlanır.
    if (blob && blob.size > MAX_BYTES && maxWidth > 1400) return prepare(file, 1400)
    return blob
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}

function PhotoButton({
  id,
  label,
  busyLabel,
  busy,
  disabled,
  light,
  onPick,
}: {
  id: string
  label: string
  busyLabel: string
  busy: boolean
  disabled?: boolean
  light?: boolean
  onPick: (file: File) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <button
        className="nb-btn"
        data-kind={light ? "light" : undefined}
        type="button"
        disabled={busy || disabled}
        onClick={() => input.current?.click()}
        style={{ marginTop: 12 }}
      >
        {busy ? busyLabel : label}
      </button>
      <input
        ref={input}
        id={id}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (file) onPick(file)
        }}
      />
    </>
  )
}

/** Bebek yüzü: ölçüm kâğıdı, ultrason görüntüsü, cinsiyet; ardından üretim ve sonuçlar. */
export function FaceStudio({ initial, week }: { initial: FaceState; week: number }) {
  const [state, setState] = useState<FaceState>(initial)
  const [paperBusy, setPaperBusy] = useState(false)
  const [paperNote, setPaperNote] = useState("")
  const [paperError, setPaperError] = useState("")
  const [scan, setScan] = useState<{ blob: Blob; preview: string } | null>(null)
  const [scanError, setScanError] = useState("")
  const [gender, setGender] = useState<"female" | "male" | null>(null)
  const [consent, setConsent] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState("")
  const [tick, setTick] = useState(0)
  const [fresh, setFresh] = useState<string | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const processing = state.items.find((item) => item.status === "processing") ?? null
  const working = starting || Boolean(processing)
  const results = state.items.filter((item) => item.status === "generated")
  const lastFailure = state.items[0]?.status === "failed" ? state.items[0] : null
  const canStart = Boolean(scan && gender && consent) && state.allowance.remaining > 0 && !working

  // Üretim sürerken durumu sor; bitince sonucu göster.
  useEffect(() => {
    if (!processing) return
    const id = processing.id
    const timer = setInterval(async () => {
      setTick((t) => t + 1)
      const result = await send<FaceState>("/api/anne/uretim", "GET")
      if (!result.ok) return
      setState(result.data)
      const mine = result.data.items.find((item) => item.id === id)
      if (mine?.status === "generated") {
        setFresh(id)
        setScan(null)
        setGender(null)
      }
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [processing])

  useEffect(() => {
    if (fresh) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [fresh])

  useEffect(() => {
    const preview = scan?.preview
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [scan])

  async function readPaper(file: File) {
    setPaperBusy(true)
    setPaperError("")
    setPaperNote("")
    const blob = await prepare(file)
    if (!blob) {
      setPaperBusy(false)
      setPaperError("Bu dosya açılamadı. Lütfen bir fotoğraf seç.")
      return
    }
    const form = new FormData()
    form.set("file", blob, "kagit.jpg")
    const result = await send<{ filled: number; draft: FaceState["draft"] }>("/api/anne/uretim/olcum", "POST", form, "Kâğıt okunamadı. Lütfen yeniden dene.")
    setPaperBusy(false)
    if (!result.ok) {
      setPaperError(result.error)
      return
    }
    setState((prev) => ({ ...prev, draft: result.data.draft }))
    setPaperNote(`${result.data.filled} ölçüm okundu.`)
  }

  async function resetPapers() {
    setPaperError("")
    setPaperNote("")
    const result = await send<{ draft: FaceState["draft"] }>("/api/anne/uretim/olcum", "DELETE", undefined, "Sıfırlanamadı.")
    if (result.ok) setState((prev) => ({ ...prev, draft: result.data.draft }))
    else setPaperError(result.error)
  }

  async function pickScan(file: File) {
    setScanError("")
    setError("")
    const blob = await prepare(file)
    if (!blob) {
      setScanError("Bu dosya açılamadı. Lütfen bir fotoğraf seç.")
      return
    }
    if (blob.size > MAX_BYTES) {
      setScanError("Fotoğraf çok büyük. Lütfen yeniden çekmeyi dene.")
      return
    }
    setScan({ blob, preview: URL.createObjectURL(blob) })
  }

  async function start() {
    if (!scan || !gender) return
    setStarting(true)
    setError("")
    setFresh(null)
    const form = new FormData()
    form.set("file", scan.blob, "ultrason.jpg")
    form.set("gender", gender)
    form.set("onay", "1")
    const result = await send<{ id: string }>("/api/anne/uretim/baslat", "POST", form, "Üretim başlatılamadı. Lütfen yeniden dene.")
    if (!result.ok) {
      setStarting(false)
      setError(result.error)
      return
    }
    const next = await send<FaceState>("/api/anne/uretim", "GET")
    if (next.ok) setState(next.data)
    setStarting(false)
  }

  async function remove(id: string) {
    const result = await send("/api/anne/uretim", "DELETE", { uretim: id }, "Silinemedi.")
    if (!result.ok) {
      setError(result.error)
      return
    }
    if (fresh === id) setFresh(null)
    setState((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }))
  }

  async function share(id: string) {
    try {
      const response = await fetch(`/api/anne/uretim?resim=${id}`)
      const file = new File([await response.blob()], "bebegimin-yuzu.png", { type: "image/png" })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Bebeğimin yüzü" })
        return
      }
    } catch {
      // Paylaşım iptal edildiyse ya da desteklenmiyorsa indirme bağlantısına düşülür.
    }
    window.location.href = `/api/anne/uretim?resim=${id}&indir=1`
  }

  const intro = results.length === 0 && (
    <>
      <h1 style={{ marginTop: 14 }}>
        Yüzünü <b>görmeye</b>
        <br />
        hazır mısın?
      </h1>
      <p className="nb-note nb-on-color" style={{ marginTop: 8, fontSize: 15 }}>
        Birkaç fotoğraf, yarım dakika.
      </p>
    </>
  )

  if (working) {
    return (
      <div className="nb-card nb-face-wait" data-tone="lilac" role="status" aria-live="polite">
        <div className="nb-face-orb" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <h3 style={{ marginTop: 22 }}>{starting ? "Görüntü denetleniyor" : WAITING[Math.floor(tick / 3) % WAITING.length]}</h3>
        <p className="nb-note" style={{ marginTop: 8 }}>
          Yaklaşık yarım dakika sürer. Bu ekranı kapatsan da resmin hazırlanır; geri geldiğinde burada olur.
        </p>
      </div>
    )
  }

  const shown = fresh ? results.find((item) => item.id === fresh) : null

  return (
    <>
      {intro}
      {shown && (
        <div ref={resultRef} className="nb-face-result">
          <h1 style={{ marginTop: 6 }}>
            İşte <b>bebeğin</b>
          </h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/anne/uretim?resim=${shown.id}`} alt="Ultrasondan üretilen bebek yüzü canlandırması" />
          <div className="nb-two" style={{ marginTop: 12 }}>
            <button className="nb-btn" type="button" style={{ marginTop: 0 }} onClick={() => void share(shown.id)}>
              Paylaş
            </button>
            <a className="nb-btn" data-kind="light" style={{ marginTop: 0 }} href={`/api/anne/uretim?resim=${shown.id}&indir=1`}>
              İndir
            </a>
          </div>
        </div>
      )}

      {lastFailure && !shown && (
        <p className="nb-error" role="alert">
          {lastFailure.error}
        </p>
      )}

      {state.allowance.remaining > 0 ? (
        <>
          <div className="nb-card" style={{ marginTop: shown ? 22 : 12 }}>
            <p className="nb-face-step">1</p>
            <h3>Ölçüm kâğıdı</h3>
            <p className="nb-note" style={{ marginTop: 6 }}>
              Doktorunun verdiği ölçüm kâğıdının ya da cihaz ekranının fotoğrafını çek. İki ayrı kâğıt varsa ikisini de ekle.
            </p>
            {state.draft.papers > 0 && (
              <p style={{ marginTop: 12 }}>
                <span className="nb-chip" data-on="">
                  {state.draft.papers} kâğıt · {state.draft.measurements} ölçüm hazır
                </span>{" "}
                <button className="nb-link" type="button" disabled={paperBusy} onClick={() => void resetPapers()}>
                  Sıfırla
                </button>
              </p>
            )}
            {paperNote && (
              <p className="nb-note" role="status" style={{ marginTop: 8 }}>
                {paperNote}
              </p>
            )}
            {paperError && (
              <p className="nb-error" role="alert">
                {paperError}
              </p>
            )}
            <PhotoButton
              id="anne-yuz-kagit"
              label={state.draft.papers > 0 ? "Bir kâğıt daha ekle" : "Kâğıdı çek"}
              busyLabel="Okunuyor"
              busy={paperBusy}
              light
              onPick={(file) => void readPaper(file)}
            />
          </div>

          <div className="nb-card" data-tone="pink">
            <p className="nb-face-step">2</p>
            <h3>Ultrason görüntüsü</h3>
            <p className="nb-note" style={{ marginTop: 6 }}>
              Bebeğin yüzünün göründüğü renkli (3B/4B) görüntüyü çek. Yandan görünen en iyisidir; çıktı ya da ekran, ikisi de olur.
            </p>
            {scan && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="nb-face-preview" src={scan.preview} alt="Seçtiğin ultrason görüntüsü" />
            )}
            {scanError && (
              <p className="nb-error" role="alert">
                {scanError}
              </p>
            )}
            <PhotoButton
              id="anne-yuz-ultrason"
              label={scan ? "Başka görüntü seç" : "Ultrasonu çek"}
              busyLabel="Hazırlanıyor"
              busy={false}
              light={Boolean(scan)}
              onPick={(file) => void pickScan(file)}
            />
          </div>

          <div className="nb-card">
            <p className="nb-face-step">3</p>
            <h3>Kız mı, erkek mi?</h3>
            <div className="nb-seg" role="group" aria-label="Bebeğin cinsiyeti" style={{ marginTop: 12, background: "var(--ground)" }}>
              <button type="button" aria-pressed={gender === "female"} onClick={() => setGender("female")}>
                Kız
              </button>
              <button type="button" aria-pressed={gender === "male"} onClick={() => setGender("male")}>
                Erkek
              </button>
            </div>
            <p className="nb-note" style={{ marginTop: 10 }}>
              Hafta hesabından alınır: {week}. hafta.
            </p>
          </div>

          <label className="nb-check" htmlFor="anne-yuz-onay" style={{ marginTop: 14 }}>
            <input id="anne-yuz-onay" type="checkbox" checked={consent} onChange={() => setConsent((v) => !v)} />
            <span>
              <b>Görüntümün işlenmesini kabul ediyorum.</b> Ultrason görüntün ve ölçümlerin, resmi üretmek için yurt dışındaki bir yapay
              zekâ hizmetine gönderilir. Yüklediğin fotoğraflar saklanmaz. [Açık rıza metni]
            </span>
          </label>

          {error && (
            <p className="nb-error" role="alert">
              {error}
            </p>
          )}
          <button className="nb-btn" type="button" disabled={!canStart} onClick={() => void start()}>
            Bebeğimin yüzünü üret
          </button>
          <p className="nb-note" style={{ marginTop: 10, textAlign: "center" }}>
            {state.allowance.remaining} üretim hakkın var. Hak yalnızca resim başarıyla üretilince düşer.
          </p>
        </>
      ) : (
        <div className="nb-card" data-tone="peach" style={{ marginTop: shown ? 22 : 12 }}>
          <h3>Üretim hakkın bitti</h3>
          <p style={{ marginTop: 6 }}>Yeni haklar yakında burada olacak. Ürettiğin resimler aşağıda durur.</p>
        </div>
      )}

      {results.length > 0 && (
        <section>
          <h3 style={{ marginTop: 26 }}>Resimlerin</h3>
          <div className="nb-grid" data-cols="2">
            {results.map((item) => (
              <div className="nb-photo" key={item.id}>
                <button type="button" className="nb-photo-open" onClick={() => setFresh(item.id)} aria-label="Resmi büyüt">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/anne/uretim?resim=${item.id}`} alt="Bebek yüzü canlandırması" loading="lazy" />
                </button>
                {item.week !== null && <span>{item.week}. hafta</span>}
                <button type="button" onClick={() => void remove(item.id)} aria-label="Resmi sil">
                  Sil
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="nb-note" style={{ marginTop: 18, textAlign: "center", fontSize: 13 }}>
        Bu resim yapay zekâ ile üretilen bir canlandırmadır. Bebeğinin doğduğunda nasıl görüneceğini göstermez ve tıbbi bilgi
        içermez.
      </p>
    </>
  )
}
