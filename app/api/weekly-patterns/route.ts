import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Doktor için haftalık pattern'i getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get("doctor_id")

    if (!doctorId) {
      return NextResponse.json({ error: "Doctor ID required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("doctor_weekly_patterns")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("day_of_week")

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Weekly pattern GET error:", error)
    return NextResponse.json({ error: "Failed to fetch patterns" }, { status: 500 })
  }
}

// POST: Haftalık pattern oluştur/güncelle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { doctor_id, patterns } = body

    if (!doctor_id || !Array.isArray(patterns)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // Mevcut patterns'i sil ve yenilerini ekle
    await supabase.from("doctor_weekly_patterns").delete().eq("doctor_id", doctor_id)

    const { data, error } = await supabase
      .from("doctor_weekly_patterns")
      .insert(
        patterns.map((p: any) => ({
          doctor_id,
          day_of_week: p.day_of_week,
          is_working: p.is_working,
          start_time: p.start_time,
          end_time: p.end_time,
          slot_duration: p.slot_duration,
          notes: p.notes,
        }))
      )
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Weekly pattern POST error:", error)
    return NextResponse.json({ error: "Failed to save patterns" }, { status: 500 })
  }
}
