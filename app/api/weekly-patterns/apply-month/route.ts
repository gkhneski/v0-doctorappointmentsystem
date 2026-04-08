import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST: Haftalık pattern'i ayın tüm günlerine uygula
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { doctor_id, year, month } = body

    if (!doctor_id || !year || !month) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Haftalık pattern'leri getir
    const { data: patterns, error: patternsError } = await supabase
      .from("doctor_weekly_patterns")
      .select("*")
      .eq("doctor_id", doctor_id)

    if (patternsError) throw patternsError

    // Ayın kaç gün olduğunu hesapla
    const daysInMonth = new Date(year, month, 0).getDate()
    const schedules = []

    // Her gün için döngü
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day)
      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay() // 1=Mon, 7=Sun

      // Pattern'i bul
      const pattern = patterns?.find((p) => p.day_of_week === dayOfWeek)

      if (pattern && pattern.is_working) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`

        // Zaten varsa atla
        const { data: existing } = await supabase
          .from("doctor_schedules")
          .select("id")
          .eq("doctor_id", doctor_id)
          .eq("schedule_date", dateStr)

        if (!existing || existing.length === 0) {
          schedules.push({
            doctor_id,
            schedule_date: dateStr,
            start_time: pattern.start_time,
            end_time: pattern.end_time,
            slot_duration: pattern.slot_duration,
            is_available: true,
            is_active: pattern.is_working,
            notes: pattern.notes,
          })
        }
      }
    }

    // Schedules'ları ekle
    if (schedules.length > 0) {
      const { error: insertError } = await supabase.from("doctor_schedules").insert(schedules)
      if (insertError) throw insertError
    }

    return NextResponse.json({
      success: true,
      created: schedules.length,
      message: `${schedules.length} schedule(s) created for ${year}-${month}`,
    })
  } catch (error) {
    console.error("[v0] Apply pattern error:", error)
    return NextResponse.json({ error: "Failed to apply pattern" }, { status: 500 })
  }
}
