export type ConfirmationView = {
  confirmation_status: string
  appointment_date: string
  appointment_time: string
  patients: { full_name: string } | null
  doctors: { name: string } | null
}

/**
 * Onay sayfasının tarayıcıya gönderdiği veri: yalnızca ekranda gösterilen alanlar.
 * Telefon, notlar, ödeme bilgisi ve kimlikler bağlantıyı açan kişiye gitmez.
 */
export function toConfirmationView(appointment: any): ConfirmationView {
  return {
    confirmation_status: appointment.confirmation_status,
    appointment_date: appointment.appointment_date,
    appointment_time: appointment.appointment_time,
    patients: appointment.patients ? { full_name: appointment.patients.full_name } : null,
    doctors: appointment.doctors ? { name: appointment.doctors.name } : null,
  }
}

function istanbulDate(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" }) // YYYY-MM-DD
}

/**
 * Onay bağlantısı randevu gününden sonraki günün sonuna kadar geçerlidir (İstanbul saati).
 * Daha eski randevuların bağlantısı açılmaz; gelecekteki randevuların eski bağlantıları çalışır.
 */
export function isConfirmationExpired(appointmentDate: string, now: Date = new Date()): boolean {
  const yesterday = istanbulDate(new Date(now.getTime() - 24 * 60 * 60 * 1000))
  return String(appointmentDate).slice(0, 10) < yesterday
}
