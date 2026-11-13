"use client"

import { useRef, useState } from "react"
import { CAFFEINE_NOTE, FOODS, FOOD_GROUPS, foodScience, foodsOfDay, groupOfDay, type FoodGroup, type Taste } from "@/lib/anne/content/foods"

const WORDS: Record<Taste, string[]> = {
  tatli: ["Mmm, bir daha!", "Bunu sevdim anne.", "Hihi, tatlıymış!"],
  aci: ["Iyy, bu ne?", "Hıh! Değişik bir tat.", "Bunu pek sevmedim."],
  sade: ["Hımm, bu da neymiş?", "Bunu tanıdım anne.", "Yine olur, anne."],
}

/**
 * "Havuç mu, lahana mı?": anne ne yediğini ya da içtiğini seçer, bebeğin yüzü tepki verir.
 * O tepkinin canlandırması "Canlı bebeğim"de açılmışsa video oynar; açılmamışsa duran resim
 * kıpırdar. Liste gruplara ayrılır; grup ve sıra her gün değişir.
 */
export function TasteGame({
  faceUrl,
  clips,
  day,
  sources,
}: {
  faceUrl: string | null
  clips: Record<Taste, string | null>
  /** Günün sıra numarası; hangi grubun ve yiyeceğin önde duracağını belirler. */
  day: number
  /** Kaynak anahtarı -> ekranda gösterilen atıf. */
  sources: Record<string, string>
}) {
  const [group, setGroup] = useState<FoodGroup>(() => groupOfDay(day))
  const [picked, setPicked] = useState<string | null>(null)
  const [turn, setTurn] = useState(0)
  const [playing, setPlaying] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  const row = useRef<HTMLDivElement>(null)

  const foods = foodsOfDay(group, day)
  const food = FOODS.find((item) => item.id === picked) ?? null
  const science = foodScience(food)

  function open(next: FoodGroup) {
    setGroup(next)
    row.current?.scrollTo({ left: 0 })
  }

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
          <img className="nb-reel-media" key={`yuz-${turn}`} data-react={food && !playing ? food.taste : undefined} src={faceUrl} alt="Bebeğinin yüzü" />
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
          <p className="nb-say" key={`soz-${turn}`} aria-live="polite">
            {WORDS[food.taste][turn % WORDS[food.taste].length]}
          </p>
        )}
      </div>
      <div className="nb-sheet">
        <h3>Bugün ne yedin, ne içtin?</h3>
        <div className="nb-foodtabs" role="group" aria-label="Yiyecek grubu">
          {FOOD_GROUPS.map((item) => (
            <button
              key={item.id}
              className="nb-chip"
              type="button"
              data-on={group === item.id ? "" : undefined}
              aria-pressed={group === item.id}
              onClick={() => open(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="nb-foods" ref={row} role="group" aria-label="Bugün yediğin ya da içtiğin">
          {foods.map((item) => (
            <button key={item.id} className="nb-food" type="button" aria-pressed={picked === item.id} onClick={() => pick(item.id)}>
              <i style={{ backgroundImage: `url(/anne/gorsel/yemek-${item.id}.jpg)` }} data-proof={item.evidence ? "" : undefined} />
              {item.label}
            </button>
          ))}
        </div>
        <div className="nb-science" aria-live="polite">
          <b>Bilim ne diyor?</b> {science.text}
          {food?.caffeine && <span style={{ display: "block", marginTop: 6 }}>{CAFFEINE_NOTE}</span>}
          <small>
            Kaynak: {sources[science.source]}
            {food?.caffeine ? `; ${sources.kafein}` : ""}. Mavi noktalı yiyecekler araştırmalarda denendi. Ekrandaki tepki yapay zekâ ile üretilmiş bir
            canlandırmadır; bebeğinin gerçek tepkisi ya da tıbbi görüntü değildir.
          </small>
        </div>
      </div>
    </>
  )
}
