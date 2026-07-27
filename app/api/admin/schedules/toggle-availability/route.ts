import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .single()

    if (!adminUser) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const body = await request.json()
    const doctorId = typeof body.doctor_id === "string" ? body.doctor_id : ""
    const scheduleDate = body.schedule_date
    const isAvailable = body.is_available

    if (!doctorId || !isIsoDate(scheduleDate) || typeof isAvailable !== "boolean") {
      return NextResponse.json({ error: "Geçersiz program bilgisi" }, { status: 400 })
    }

    const serviceSupabase = createServiceRoleClient()
    const { data: schedules, error: findError } = await serviceSupabase
      .from("doctor_schedules")
      .select("id")
      .eq("doctor_id", doctorId)
      .eq("schedule_date", scheduleDate)

    if (findError) throw findError
    if (!schedules?.length) {
      return NextResponse.json({ error: "Bu gün için doktor programı bulunamadı" }, { status: 404 })
    }

    const scheduleIds = schedules.map((schedule) => schedule.id)
    const { error: updateError } = await serviceSupabase
      .from("doctor_schedules")
      .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
      .in("id", scheduleIds)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      doctor_id: doctorId,
      schedule_date: scheduleDate,
      is_available: isAvailable,
      updated: scheduleIds.length,
    })
  } catch (error) {
    console.error("[v0] Schedule availability toggle error:", error)
    return NextResponse.json({ error: "Gün durumu güncellenemedi" }, { status: 500 })
  }
}
