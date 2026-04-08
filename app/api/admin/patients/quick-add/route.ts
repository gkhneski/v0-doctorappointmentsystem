import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

const SITE_URL = "https://www.dreraycaliskan.com"
const GOOGLE_MAPS_LINK = "https://maps.google.com/?q=Prof+Dr+Eray+Caliskan+Kadin+Hastaliklari+Istanbul"

async function sendSMS(phone: string, message: string): Promise<boolean> {
  const netgsmUser = process.env.NETGSM_USER
  const netgsmPassword = process.env.NETGSM_PASSWORD
  const netgsmHeader = process.env.NETGSM_HEADER || "SAGLIK"

  if (!netgsmUser || !netgsmPassword) return false

  let cleanPhone = phone.replace(/\D/g, "")
  if (cleanPhone.startsWith("0")) cleanPhone = "90" + cleanPhone.substring(1)
  else if (!cleanPhone.startsWith("90")) cleanPhone = "90" + cleanPhone

  const url = `https://api.netgsm.com.tr/sms/send/get/?usercode=${netgsmUser}&password=${netgsmPassword}&gsmno=${cleanPhone}&message=${encodeURIComponent(message)}&msgheader=${netgsmHeader}`

  try {
    const res = await fetch(url)
    const result = await res.text()
    return result.trim().startsWith("00") || result.trim().startsWith("01")
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })

    const { full_name, phone } = await request.json()

    if (!full_name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "Ad soyad ve telefon zorunludur" }, { status: 400 })
    }

    const supabaseAdmin = createServiceRoleClient()

    // Telefon ile mevcut hasta kontrolü
    const { data: existing } = await supabaseAdmin
      .from("patients")
      .select("id, full_name, phone")
      .eq("phone", phone.trim())
      .maybeSingle()

    let patientId: string
    let isNew = false

    if (existing) {
      patientId = existing.id
    } else {
      // Yeni hasta kaydı oluştur (TC ve doğum tarihi olmadan)
      const { data: newPatient, error: insertError } = await supabaseAdmin
        .from("patients")
        .insert({
          full_name: full_name.trim(),
          phone: phone.trim(),
          tc_no: "",
          date_of_birth: "1900-01-01",
          kvkk_approved: false,
        })
        .select("id")
        .single()

      if (insertError || !newPatient) {
        return NextResponse.json({ error: "Hasta kaydedilemedi" }, { status: 500 })
      }

      patientId = newPatient.id
      isNew = true
    }

    // Hoş geldin SMS'i gönder — site linki + Google Maps
    const firstName = full_name.trim().split(" ")[0]
    const smsMessage =
      `Sayin ${firstName} Hanim, Prof. Dr. Eray Caliskan klinigine hosgeldiniz!\n\n` +
      `Online randevu icin web sitemiz:\n${SITE_URL}\n\n` +
      `Klinigimizin konumu icin:\n${GOOGLE_MAPS_LINK}`

    const smsSent = await sendSMS(phone.trim(), smsMessage)

    // sent_messages tablosuna kaydet
    await supabaseAdmin.from("sent_messages").insert({
      patient_id: patientId,
      phone_number: phone.trim(),
      message_content: smsMessage,
      channel: "sms",
      status: smsSent ? "sent" : "failed",
      sent_by: user.id,
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      patientId,
      isNew,
      smsSent,
      message: isNew
        ? `Hasta kaydedildi ve SMS gönderildi`
        : `Mevcut hasta bulundu (${existing!.full_name}), SMS gönderildi`,
    })
  } catch (error) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
