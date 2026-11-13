"use client"

import { useRef, useState } from "react"

type Taste = "tatli" | "aci"

// Araştırmada tatlı tat için havuç, acı tat için lahana denendi. Diğer yiyecekler tat ailesine
// göre (tatlı ya da acı, ekşi, keskin) bizim eşleştirmemizdir; ekranda da böyle yazar.
// Fotoğraflar public/anne/gorsel/yemek-*.jpg dosyalarıdır (kaynakları aynı klasörde).
const FOODS: { id: string; label: string; taste: Taste }[] = [
  { id: "havuc", label: "Havuç", taste: "tatli" },
  { id: "lahana", label: "Lahana", taste: "aci" },
  { id: "cilek", label: "Çilek", taste: "tatli" },
  { id: "limon", label: "Limon", taste: "aci" },
  { id: "muz", label: "Muz", taste: "tatli" },
  { id: "brokoli", label: "Brokoli", taste: "aci" },
  { id: "karpuz", label: "Karpuz", taste: "tatli" },
  { id: "sarimsak", label: "Sarımsak", taste: "aci" },
  { id: "elma", label: "Elma", taste: "tatli" },
  { id: "greyfurt", label: "Greyfurt", taste: "aci" },
  { id: "hurma", label: "Hurma", taste: "tatli" },
  { id: "biber", label: "Acı biber", taste: "aci" },
  { id: "bal", label: "Bal", taste: "tatli" },
  { id: "cikolata", label: "Çikolata", taste: "tatli" },
]

/** Liste her gün başka bir yiyecekten başlar; böylece her gün aynı dördü öne çıkmaz. */
export function foodsOfDay(day: number): typeof FOODS {
  const start = ((day % FOODS.length) + FOODS.length) % FOODS.length
  return [...FOODS.slice(start), ...FOODS.slice(0, start)]
}

const WORDS: Record<Taste, string[]> = {
  tatli: ["Mmm, bir daha!", "Bunu sevdim anne.", "Hihi, tatlıymış!"],
  aci: ["Iyy, bu ne?", "Hıh! Acıymış.", "Bunu pek sevmedim."],
}

/**
 * "Havuç mu, lahana mı?": anne ne yediğini seçer, bebeğin yüzü tepki verir. O tepkinin
 * canlandırması "Canlı bebeğim"de açılmışsa video oynar; açılmamışsa duran resim kıpırdar.
 */
export function TasteGame({
  faceUrl,
  clips,
  day,
  science,
  source,
}: {
  faceUrl: string | null
  clips: Record<Taste, string | null>
  /** Günün sıra numarası; listenin hangi yiyecekten başlayacağını belirler. */
  day: number
  science: string
  source: string
}) {
  const [picked, setPicked] = useState<string | null>(null)
  const [turn, setTurn] = useState(0)
  const [playing, setPlaying] = useState(false)
  const video = useRef<HTMLVideoElement>(null)

  const foods = foodsOfDay(day)
  const food = FOODS.find((item) => item.id === picked) ?? null

  function pick(id: string) {
    const next = FOODS.find((item) => item.id === id)
    if (!next) return
    setPicked(id)
    setTurn((n) => n + 1)
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(12)

    const clip = clips[next.taste]
    const element = video.current
    if (!clip || !element) return
    element.src = `/api/anne/canli?klip=${clip}`
    element.currentTime = 0
    setPlaying(true)
    void element.play().catch(() => {
      // Tarayıcı sesi engellediyse sessiz oynat.
      element.muted = true
      void element.play().catch(() => setPlaying(false))
    })
  }

  return (
    <>
      <div className="nb-reel-stage">
        {faceUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="nb-reel-media" key={turn} data-react={food && !playing ? food.taste : undefined} src={faceUrl} alt="Bebeğinin yüzü" />
        )}
        <video
          ref={video}
          className="nb-baby-video"
          data-on={playing ? "" : undefined}
          playsInline
          preload="none"
          onEnded={() => setPlaying(false)}
          onError={() => setPlaying(false)}
        />
        {food && (
          <p className="nb-say" key={turn} aria-live="polite">
            {WORDS[food.taste][turn % WORDS[food.taste].length]}
          </p>
        )}
      </div>
      <div className="nb-sheet">
        <h3>Bugün ne yedin?</h3>
        <p className="nb-note" style={{ marginTop: 2 }}>
          Seç, bebeğinin tepkisini gör. Kaydır, daha fazlası var.
        </p>
        <div className="nb-foods" role="group" aria-label="Bugün yediğin">
          {foods.map((item) => (
            <button key={item.id} className="nb-food" type="button" aria-pressed={picked === item.id} onClick={() => pick(item.id)}>
              <i style={{ backgroundImage: `url(/anne/gorsel/yemek-${item.id}.jpg)` }} />
              {item.label}
            </button>
          ))}
        </div>
        <div className="nb-science">
          <b>Bilim ne diyor?</b> {science}
          <small>Kaynak: {source}. Ekrandaki tepki yapay zekâ ile üretilmiş bir canlandırmadır; bebeğinin gerçek tepkisi ya da tıbbi görüntü değildir.</small>
        </div>
      </div>
    </>
  )
}
