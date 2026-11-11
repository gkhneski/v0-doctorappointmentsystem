// Ad alanı serbest metindir (kızlık soyadı parantezi, yabancı alfabeler, yapıştırılmış boşluklar...).
// Bu yüzden "neye izin var" yerine "ne tehlikeli" sorusuna bakılır: HTML/şablon işaretleri ve
// kontrol karakterleri reddedilir, en az iki harf aranır. Ekrana basılırken ayrıca kaçışlanır.
const NAME_FORBIDDEN = /[<>"`{}\\]|\p{Cc}/u
const TYPE_PATTERN = /^[\p{L}\p{N} ._()\/+&,-]+$/u

const NAME_ERROR = "Lütfen adınızı ve soyadınızı geçerli biçimde yazın."
const TYPE_ERROR = "Geçersiz randevu türü."

/**
 * Herkese açık randevu isteğindeki serbest metin alanlarını doğrular.
 * Geçerliyse null, değilse kullanıcıya gösterilecek hata metnini döner.
 * Personelin açtığı randevulara uygulanmaz.
 */
export function validatePublicBooking(input: { patient_name: unknown; appointment_type: unknown }): string | null {
  const name =
    typeof input.patient_name === "string" ? input.patient_name.normalize("NFC").replace(/\s+/gu, " ").trim() : ""
  const letterCount = (name.match(/\p{L}/gu) ?? []).length
  if (name.length < 2 || name.length > 80 || letterCount < 2 || NAME_FORBIDDEN.test(name)) return NAME_ERROR

  const type = input.appointment_type
  if (typeof type !== "string" || type.length < 1 || type.length > 80 || !TYPE_PATTERN.test(type)) return TYPE_ERROR

  return null
}
