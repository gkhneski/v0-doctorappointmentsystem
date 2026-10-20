import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { normalizePhone, toNetgsmNumber } from "@/lib/phone"

export async function POST(request: Request) {
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

    const cleanPhone = toNetgsmNumber(patientPhone)
    if (!cleanPhone) {
      return NextResponse.json({ error: "Geçerli bir cep telefonu numarası yok" }, { status: 400 })
    }

    // NETGSM credentials from environment
    const netgsmUser = process.env.NETGSM_USER
    const netgsmPassword = process.env.NETGSM_PASSWORD
    const netgsmHeader = process.env.NETGSM_HEADER

    if (!netgsmUser || !netgsmPassword || !netgsmHeader) {
      return NextResponse.json({ error: "NETGSM yapılandırması eksik" }, { status: 500 })
    }

    // Send SMS via NETGSM API
    const netgsmUrl = `https://api.netgsm.com.tr/sms/send/get/?usercode=${netgsmUser}&password=${netgsmPassword}&gsmno=${cleanPhone}&message=${encodeURIComponent(message)}&msgheader=${netgsmHeader}`

    const netgsmResponse = await fetch(netgsmUrl)
    const netgsmResult = await netgsmResponse.text()

    console.log("NETGSM Response:", netgsmResult)

    // NETGSM returns response codes: 00, 01, 02, etc.
    // 00 or 01 = success
    const isSuccess = netgsmResult.trim().startsWith("00") || netgsmResult.trim().startsWith("01")

    if (!isSuccess) {
      console.error("NETGSM Error:", netgsmResult)
      return NextResponse.json({ error: `SMS gönderilemedi: ${netgsmResult}` }, { status: 400 })
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
