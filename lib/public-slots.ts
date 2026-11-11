export type PublicSlot = {
  id: string
  doctor_id: string
  appointment_date: string
  appointment_time: string
  status: string
}

/**
 * Herkese açık takvime giden "dolu saat" listesi. Gerçek randevu kimliği tarayıcıya gönderilmez;
 * takvim bileşeni `id`'yi yalnızca liste anahtarı olarak kullandığı için tarih_saat yeterlidir.
 */
export function toPublicSlots(
  rows: { doctor_id: string; appointment_date: string; appointment_time: string; status: string }[],
): PublicSlot[] {
  return rows.map((r) => ({
    id: `${r.appointment_date}_${r.appointment_time}`,
    doctor_id: r.doctor_id,
    appointment_date: r.appointment_date,
    appointment_time: r.appointment_time,
    status: r.status,
  }))
}
