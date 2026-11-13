// Renk teması: kız bebek pembe, erkek bebek açık mavi, bilinmiyorsa sade.
// Bu dosya yalnızca veri ve saf işlevler içerir; tarayıcıda da sunucuda da kullanılır.

export const THEMES = ["kiz", "erkek", "sade"] as const
export type Theme = (typeof THEMES)[number]

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value)
}

/** Annenin seçimi varsa o; yoksa bebek yüzünde seçilen cinsiyet; o da yoksa sade. */
export function resolveTheme(choice: unknown, gender: unknown): Theme {
  if (isTheme(choice)) return choice
  if (gender === "female") return "kiz"
  if (gender === "male") return "erkek"
  return "sade"
}
