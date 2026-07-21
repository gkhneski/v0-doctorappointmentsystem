import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function GET(request: Request, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    const { patientId } = await params

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { data: adminUser } = await supabase.from("admin_users").select("id").eq("id", user.id).single()
    if (!adminUser) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const serviceSupabase = createServiceRoleClient()
    const { data: appointments, error } = await serviceSupabase
      .from("appointments")
      .select("id, appointment_date, appointment_time, status, appointment_type, print_type, notes")
      .eq("patient_id", patientId)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false })
      .limit(50)

    if (error) {
      console.error("[v0] Patient appointments error:", error)
      return NextResponse.json({ error: "Randevular alınamadı" }, { status: 500 })
    }

    return NextResponse.json({ appointments: appointments || [] })
  } catch (error) {
    console.error("[v0] Patient appointments route error:", error)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
