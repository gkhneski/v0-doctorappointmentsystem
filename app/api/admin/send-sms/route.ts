import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { sendSms } from "@/lib/sms"
import { normalizePhone, toNetgsmNumber } from "@/lib/phone"
import { requireAdmin } from "@/lib/require-admin"

export async function POST(request: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { patientId, patientPhone, message, templateId } = await request.json()

    if (!patientPhone || !message) {
      return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 })
    }

    if (!toNetgsmNumber(patientPhone)) {
      return NextResponse.json({ error: "Geçerli bir cep telefonu numarası yok" }, { status: 400 })
    }

    const sms = await sendSms(patientPhone, message, { strictPhone: true })

    if (sms.code === "credentials_missing") {
      return NextResponse.json({ error: "NETGSM yapılandırması eksik" }, { status: 500 })
    }
    if (!sms.sent) {
      return NextResponse.json({ error: `SMS gönderilemedi: ${sms.code}` }, { status: 400 })
    }

    // Save to sent_messages table
    const supabaseAdmin = await createServiceRoleClient()

    await supabaseAdmin.from("sent_messages").insert({
      patient_id: patientId || null,
      template_id: templateId,
      phone_number: normalizePhone(patientPhone),
      message_content: message,
      channel: "sms",
      status: "sent",
      sent_by: user.id,
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, message: "SMS başarıyla gönderildi" })
  } catch (error) {
    console.error("SMS send error:", error)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
