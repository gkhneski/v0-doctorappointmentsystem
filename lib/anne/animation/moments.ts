// "Canlı bebeğim": üretilen bebek yüzünün kısa canlandırmaları. Yalnızca düz veri ve saf
// işlevler; hem sunucu hem tarayıcı kullanır.
//
// Bu dosya bebek yüzü ÜRETİMİNE dokunmaz (o hat eski sistemle aynıdır ve kilitlidir,
// lib/anne/generation). Burada yalnızca üretilmiş resim hareketlendirilir.

export const MOMENTS = [
  { kind: "gulumse", label: "Gülümse", sound: "Hihi!" },
  { kind: "esne", label: "Esne", sound: "Aaah… uykum var" },
  { kind: "kikirde", label: "Kıkırda", sound: "Kih kih kih!" },
  { kind: "agu", label: "Agu", sound: "Aguuu" },
  { kind: "emme", label: "Mışıl", sound: "Mmm…" },
  { kind: "somurt", label: "Somurt", sound: "Hıh!" },
  { kind: "hapsir", label: "Hapşu", sound: "Hapşu!" },
] as const

export type MomentKind = (typeof MOMENTS)[number]["kind"]

export function isMomentKind(value: unknown): value is MomentKind {
  return typeof value === "string" && MOMENTS.some((m) => m.kind === value)
}

export function momentOf(kind: string) {
  return MOMENTS.find((m) => m.kind === kind) ?? MOMENTS[0]
}

/** Henüz açılmamış ilk an; hepsi açıldıysa null. */
export function nextMomentKind(opened: readonly string[]): MomentKind | null {
  return MOMENTS.find((m) => !opened.includes(m.kind))?.kind ?? null
}

// Her yönergenin ortak kısmı: kamera sabit, bebek aynı bebek, gözler kapalı, sonunda ilk
// kareye dönüş (klip bitince duran resme yumuşak geçsin diye).
const FRAME =
  "Animate this exact photo of a sleeping baby. The camera is completely static; framing, background, lighting, skin tone and the baby's identity stay exactly the same as in the photo. The baby stays asleep with eyes closed the whole time. Movement is subtle, natural and gentle."
const ENDING = "At the end the baby relaxes back to the exact resting expression of the photo."
const AUDIO = "No music, no speech, no words, no adult voice."

const ACTIONS: Record<MomentKind, string> = {
  gulumse: `The baby breathes gently and slowly breaks into a small sweet sleepy smile. ${ENDING} Audio: one soft quiet newborn coo. ${AUDIO}`,
  esne: `The baby opens the mouth wide in a big slow newborn yawn, scrunching the face a little, then closes the mouth. ${ENDING} Audio: a tiny soft yawn sigh. ${AUDIO}`,
  kikirde: `The baby giggles in sleep: the mouth opens into a happy grin, cheeks lift and the face shakes slightly two or three times. ${ENDING} Audio: a short soft baby giggle. ${AUDIO}`,
  agu: `The baby rounds the lips and makes a small cooing "ah-goo" mouth movement, as if babbling in sleep. ${ENDING} Audio: a gentle newborn "agoo" coo. ${AUDIO}`,
  emme: `The baby makes slow little sucking movements with the lips, as if dreaming of feeding, cheeks moving softly. ${ENDING} Audio: very quiet soft suckling sounds. ${AUDIO}`,
  somurt: `The baby frowns and pouts for a moment, eyebrows pulling together and the lower lip pushing out in a grumpy sleepy face, then the face softens. ${ENDING} Audio: one tiny grumpy newborn grunt. ${AUDIO}`,
  hapsir: `The baby scrunches the nose, takes a tiny breath and does one small cute newborn sneeze, the head giving a slight jolt. ${ENDING} Audio: one tiny baby sneeze. ${AUDIO}`,
}

export function momentPrompt(kind: MomentKind): string {
  return `${FRAME} ${ACTIONS[kind]}`
}

/** Canlandırmaların (videoların) durduğu, herkese kapalı depo. */
export const MOMENT_BUCKET = "anne-video"

/** Klip uzunluğu ve çözünürlüğü. Maliyet buna bağlıdır (720p: saniyesi yaklaşık 0,07 dolar). */
export const MOMENT_DURATION = "5s"
export const MOMENT_RESOLUTION = "720p"

// Bebeğin "söyledikleri". Gelişimle ilgili hiçbir bilgi iddiası içermez (duymak, görmek,
// hissetmek gibi); yalnızca sevgi sözleri, hafta ve kalan gün. Tıbbi içerik değildir.
const GREETINGS = {
  morning: ["Günaydın anne!", "Uyandın mı anne?", "Günaydın, ben buradayım."],
  day: ["Merhaba anne!", "Anne, geldin mi?", "Bak ben buradayım!"],
  evening: ["İyi akşamlar anne.", "Anne, bugün nasıldı?", "Akşam oldu, yanındayım."],
  night: ["İyi geceler anne.", "Uyku vakti mi anne?", "Tatlı rüyalar anne."],
} as const

const LINES = [
  "Bugün de seninleyim.",
  "Beni görmeye geldin, çok sevindim.",
  "Her gün biraz daha büyüyorum.",
  "Seni çok merak ediyorum.",
  "Bana bir isim buldun mu?",
  "Bugün kendine iyi bak, olur mu?",
  "Yarın yine gel, sana bir sürprizim var.",
  "Kavuşacağımız günü sayıyorum.",
  "En sevdiğim yer senin yanın.",
  "Bugün bana bir şarkı söyler misin?",
  "Babama da selam söyle.",
  "Bugün gülümsedin mi anne?",
] as const

function partOfDay(hour: number): keyof typeof GREETINGS {
  if (hour >= 5 && hour < 11) return "morning"
  if (hour >= 11 && hour < 18) return "day"
  if (hour >= 18 && hour < 22) return "evening"
  return "night"
}

/** Günün sözü: aynı gün aynı söz çıkar (gün numarasına göre), ertesi gün değişir. */
export function dailyWords(input: { today: string; hour: number; weeks: number; extraDays: number; daysToDue: number }): string[] {
  const dayNumber = Math.floor(Date.parse(`${input.today}T00:00:00Z`) / 86_400_000)
  const greetings = GREETINGS[partOfDay(input.hour)]
  const age = input.extraDays > 0 ? `${input.weeks} hafta ${input.extraDays} günlüğüm` : `tam ${input.weeks} haftalığım`
  const words = [greetings[dayNumber % greetings.length], `Bugün ${age}.`, LINES[dayNumber % LINES.length]]
  if (input.daysToDue > 0 && dayNumber % 3 === 0) words.push(`Kavuşmamıza ${input.daysToDue} gün kaldı.`)
  return words
}
