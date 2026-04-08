import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { token, action } = await request.json()

    if (!token || !action) {
      return NextResponse.json({ error: "Token ve işlem gerekli" }, { status: 400 })
    }

    if (!["confirm", "cancel"].includes(action)) {
      return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Find appointment by token
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("*")
      .eq("confirmation_token", token)
      .single()

    if (fetchError || !appointment) {
      return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 })
    }

    // Check if already processed
    if (appointment.confirmation_status !== "pending") {
      return NextResponse.json(
        { error: "Bu randevu zaten işlenmiş", status: appointment.confirmation_status },
        { status: 400 }
      )
    }

    // Update confirmation status
    const newStatus = action === "confirm" ? "confirmed" : "cancelled"
    const now = new Date().toISOString()
    const updateData: any = {
      confirmation_status: newStatus,
      confirmed_at: now,
      // link_clicked_at zaten set edilmemisse simdi set et
      link_clicked_at: appointment.link_clicked_at || now,
    }

    // If cancelled, also update appointment status
    if (action === "cancel") {
      updateData.status = "cancelled"
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointment.id)

    if (updateError) {
      console.error("[v0] Update error:", updateError)
      return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 })
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error: any) {
    console.error("[v0] Confirmation error:", error)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
