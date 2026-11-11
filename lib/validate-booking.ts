const NAME_PATTERN = /^\p{L}[\p{L} .'’-]*$/u
const TYPE_PATTERN = /^[\p{L}\p{N} ._()\/+&,-]+$/u

const NAME_ERROR = "Lütfen adınızı ve soyadınızı yalnızca harflerle yazın."
const TYPE_ERROR = "Geçersiz randevu türü."

/**
 * Herkese açık randevu isteğindeki serbest metin alanlarını doğrular.
 * Geçerliyse null, değilse kullanıcıya gösterilecek hata metnini döner.
 * Personelin açtığı randevulara uygulanmaz.
 */
export function validatePublicBooking(input: { patient_name: unknown; appointment_type: unknown }): string | null {
  const name = typeof input.patient_name === "string" ? input.patient_name.trim() : ""
  if (name.length < 2 || name.length > 80 || !NAME_PATTERN.test(name)) return NAME_ERROR

  const type = input.appointment_type
  if (typeof type !== "string" || type.length < 1 || type.length > 80 || !TYPE_PATTERN.test(type)) return TYPE_ERROR

  return null
}
