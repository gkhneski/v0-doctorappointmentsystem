import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

// 15 dakikalık slotları üretir
function generateSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = []
  const [sh, sm] = startTime.split(":").map(Number)
  const [eh, em] = endTime.split(":").map(Number)
  let totalStart = sh * 60 + sm
  const totalEnd = eh * 60 + em

  // Başlangıcı 15'in katına yuvarla (yukarı)
  const rem = totalStart % 15
  if (rem !== 0) totalStart += 15 - rem

  while (totalStart <= totalEnd) {
    const h = Math.floor(totalStart / 60)
    const m = totalStart % 60
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
    totalStart += 15
  }
  return slots
}

const DAY_NAMES_TR: Record<number, string> = {
  1: "Pazartesi",
  2: "Salı",
  3: "Çarşamba",
  4: "Perşembe",
  5: "Cuma",
}

const MONTH_NAMES_TR = [
  "Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
  "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık",
]

export async function POST(req: Request) {
  try {
    const { appointmentTypeId, offsetDays = 0 } = await req.json()
    const supabase = createServiceRoleClient()

    // Tek doktoru getir
    const { data: doctors } = await supabase.from("doctors").select("id").limit(1)
    if (!doctors || doctors.length === 0) return NextResponse.json({ slots: [], hasMore: false })
    const doctorId = doctors[0].id

    // Offset'e göre tarih aralığını belirle (her sayfa 30 gün)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = new Date(today)
    startDate.setDate(today.getDate() + offsetDays)
    const futureDate = new Date(startDate)
    futureDate.setDate(startDate.getDate() + 30)

    const startStr = startDate.toISOString().split("T")[0]
    const futureStr = futureDate.toISOString().split("T")[0]
    const todayStr = today.toISOString().split("T")[0]

    const { data: schedules } = await supabase
      .from("doctor_schedules")
      .select("schedule_date, start_time, end_time, is_available")
      .eq("doctor_id", doctorId)
      .eq("is_available", true)
      .gte("schedule_date", startStr)
      .lte("schedule_date", futureStr)
      .order("schedule_date", { ascending: true })

    if (!schedules || schedules.length === 0) return NextResponse.json({ slots: [] })

    // Mevcut randevuları getir (bu tarih aralığı için)
    const { data: existingAppts } = await supabase
      .from("appointments")
      .select("appointment_date, appointment_time")
      .eq("doctor_id", doctorId)
      .gte("appointment_date", startStr)
      .lte("appointment_date", futureStr)
      .not("status", "eq", "cancelled")

    // Dolu slotları bir set'e al
    const bookedSet = new Set(
      (existingAppts || []).map((a) => `${a.appointment_date}_${a.appointment_time?.slice(0, 5)}`)
    )

    // Bugün için geçmiş saatleri atla
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes()

    const availableSlots: { date: string; time: string; label: string }[] = []

    for (const schedule of schedules) {
      const dateObj = new Date(schedule.schedule_date + "T00:00:00")
      const dayOfWeek = dateObj.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) continue // hafta sonu

      const times = generateSlots(schedule.start_time, schedule.end_time)

      for (const time of times) {
        const key = `${schedule.schedule_date}_${time}`
        if (bookedSet.has(key)) continue

        // Bugün için geçmiş saatleri atla (30 dk buffer)
        if (schedule.schedule_date === todayStr) {
          const [th, tm] = time.split(":").map(Number)
          if (th * 60 + tm < nowMinutes + 30) continue
        }

        const day = DAY_NAMES_TR[dayOfWeek] || ""
        const d = dateObj.getDate()
        const month = MONTH_NAMES_TR[dateObj.getMonth()]
        const label = `${day}, ${d} ${month} - ${time}`

        availableSlots.push({ date: schedule.schedule_date, time, label })

        if (availableSlots.length >= 5) break
      }
      if (availableSlots.length >= 5) break
    }

    // Daha fazla slot olup olmadığını kontrol et
    const hasMore = offsetDays + 30 < 90 // Max 3 ay ileriye bak

    return NextResponse.json({ slots: availableSlots, hasMore, nextOffset: offsetDays + 30 })
  } catch (err) {
    console.error("[ai-randevu/slots]", err)
    return NextResponse.json({ slots: [], hasMore: false }, { status: 500 })
  }
}
