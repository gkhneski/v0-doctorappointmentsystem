// Hasta SMS penceresinde işaretlenen ilaç, vitamin ve tahlil/evrak öğelerini
// mesaj metnine yerleştirir. Kutucuk işaretlendiği anda metin güncellenir;
// ayrı bir "ekle" adımı yoktur.

export type SelectedItems = {
  medication: string[]
  vitamin: string[]
  test: string[]
}

export const EMPTY_SELECTION: SelectedItems = { medication: [], vitamin: [], test: [] }

const HEADINGS: Array<[keyof SelectedItems, string]> = [
  ["medication", "İlaçlarınız"],
  ["vitamin", "Vitaminleriniz"],
  ["test", "Tahlil ve evraklarınız"],
]

export function toggleItem(selected: SelectedItems, category: keyof SelectedItems, item: string): SelectedItems {
  const current = selected[category]
  return {
    ...selected,
    [category]: current.includes(item) ? current.filter((i) => i !== item) : [...current, item],
  }
}

/** Seçili öğelerin mesajdaki karşılığı. Seçim yoksa boş metin. */
export function buildItemsBlock(selected: SelectedItems): string {
  return HEADINGS.filter(([category]) => selected[category].length > 0)
    .map(([category, heading]) => `${heading}:\n${selected[category].map((item) => `- ${item}`).join("\n")}`)
    .join("\n\n")
}

export function greeting(patientName: string): string {
  return `Merhaba ${patientName},`
}

/**
 * Mesajdaki eski öğe bölümünü yenisiyle değiştirir. Personelin elle yazdığı
 * metne dokunmaz. Eski bölüm elle değiştirilmişse yerinde bırakılır ve yeni
 * bölüm sona eklenir.
 */
export function applyItemsBlock(message: string, previousBlock: string, nextBlock: string, patientName: string): string {
  let base = message
  if (previousBlock && base.includes(previousBlock)) {
    base = base.replace(previousBlock, () => "")
  }
  base = base.trimEnd()

  if (!nextBlock) {
    return base === greeting(patientName) ? "" : base
  }
  if (!base) {
    return `${greeting(patientName)}\n\n${nextBlock}`
  }
  return `${base}\n\n${nextBlock}`
}
