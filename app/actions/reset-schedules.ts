"use server"

import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function resetSchedulesForMonth(year: number, month: number) {
  const supabase = createServiceRoleClient()

  console.log("[v0] Starting reset for", year, month)

  // 1) Tüm randevuları sil
  const { error: deleteAppointmentsError } = await supabase
    .from("appointments")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all

  if (deleteAppointmentsError) {
    console.error("[v0] Appointment delete error:", deleteAppointmentsError)
    return { success: false, error: "Randevular silinemedi" }
  }

  // 2) O ayın TÜM programlarını sil (hafta sonu dahil)
  const daysInMonth = new Date(year, month, 0).getDate()
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`

  const { error: deleteSchedulesError } = await supabase
    .from("doctor_schedules")
    .delete()
    .gte("schedule_date", startDate)
    .lte("schedule_date", endDate)

  if (deleteSchedulesError) {
    console.error("[v0] Schedule delete error:", deleteSchedulesError)
    return { success: false, error: "Programlar silinemedi" }
  }

  // 3) Sadece iş günleri için yeni programlar oluştur
  const schedules = []

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const dayOfWeek = date.getDay() // 0=Pazar, 1=Pzt, ..., 6=Cmt

    // Sadece Pazartesi-Cuma (1-5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      // Salı(2) ve Perşembe(4): 13:00-18:00 | Pzt(1),Çar(3),Cum(5): 11:30-18:00
      const isTueThu = dayOfWeek === 2 || dayOfWeek === 4
      schedules.push({
        doctor_id: "8d8e6b45-ed47-4e79-be36-5f1bce4203e6", // Prof. Dr. Eray Çalışkan
        schedule_date: dateStr,
        start_time: isTueThu ? "13:00" : "11:30",
        end_time: "18:00",
        time_slots: [],
        is_available: false,
      })
    }
  }

  console.log(`[v0] Creating ${schedules.length} weekday schedules for ${year}-${month}`)

  const { error: insertError } = await supabase.from("doctor_schedules").insert(schedules)

  if (insertError) {
    console.error("[v0] Schedule insert error:", insertError)
    return { success: false, error: "Programlar oluşturulamadı: " + insertError.message }
  }

  return { success: true, created: schedules.length }
}
