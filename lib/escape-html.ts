const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}

/** HTML metnine gömülecek bir değeri zararsız hale getirir. null/undefined boş metin olur. */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return ""
  return String(value).replace(/[&<>"']/g, (ch) => ENTITIES[ch])
}
