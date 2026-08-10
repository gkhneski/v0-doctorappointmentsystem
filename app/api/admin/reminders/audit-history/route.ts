import { NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/admin-auth"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

function normalize(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ıİ]/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
}

export async function GET(request: Request) {
  const { user, adminUser } = await getAdminAuth()
  if (!user || !adminUser) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

  const query = new URL(request.url).searchParams.get("q")?.trim() || ""
  if (query.length < 2) return NextResponse.json({ events: [] })

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from("appointment_audit_events")
    .select("id, patient_id, appointment_id, event_type, occurred_at, patient_name_snapshot, patient_phone_snapshot, appointment_date_snapshot, appointment_time_snapshot, message_text, channel, delivery_status, response_type, ip_address, user_agent, event_hash")
    .order("occurred_at", { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: "Geçmiş alınamadı" }, { status: 500 })

  const needle = normalize(query)
  const events = (data || []).filter((event) =>
    normalize(`${event.patient_name_snapshot} ${event.patient_phone_snapshot || ""}`).includes(needle),
  )

  return NextResponse.json({ events })
}
