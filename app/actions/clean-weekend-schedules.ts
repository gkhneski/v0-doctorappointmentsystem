"use server"

import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function cleanWeekendSchedules() {
  const supabase = createServiceRoleClient()

  console.log("[v0] Hafta sonu kayıtları temizleniyor...")

  // Önce tüm schedule'ları çek
  const { data: allSchedules, error: fetchError } = await supabase
    .from("doctor_schedules")
    .select("id, schedule_date")
    .order("schedule_date", { ascending: true })

  if (fetchError) {
    console.error("[v0] Fetch hatası:", fetchError)
    return { success: false, error: fetchError.message }
  }

  console.log("[v0] Toplam kayıt sayısı:", allSchedules?.length)

  // Hafta sonu kayıtlarını filtrele
  const weekendIds: string[] = []
  allSchedules?.forEach((schedule) => {
    const date = new Date(schedule.schedule_date + "T12:00:00") // Timezone sorunlarını önlemek için öğlen saati
    const dayOfWeek = date.getDay() // 0 = Pazar, 6 = Cumartesi

    console.log(`[v0] Tarih: ${schedule.schedule_date}, Gün: ${dayOfWeek}`)

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendIds.push(schedule.id)
      console.log(
        `[v0] Hafta sonu kaydı bulundu: ${schedule.schedule_date} (${dayOfWeek === 0 ? "Pazar" : "Cumartesi"})`,
      )
    }
  })

  console.log("[v0] Silinecek hafta sonu kayıtları:", weekendIds.length)

  if (weekendIds.length === 0) {
    return {
      success: true,
      message: "Hafta sonu kaydı bulunamadı",
      deletedCount: 0,
    }
  }

  // Hafta sonu kayıtlarını sil
  const { error: deleteError } = await supabase.from("doctor_schedules").delete().in("id", weekendIds)

  if (deleteError) {
    console.error("[v0] Silme hatası:", deleteError)
    return { success: false, error: deleteError.message }
  }

  console.log("[v0] Başarıyla silindi:", weekendIds.length, "kayıt")

  return {
    success: true,
    message: `${weekendIds.length} hafta sonu kaydı silindi`,
    deletedCount: weekendIds.length,
  }
}
