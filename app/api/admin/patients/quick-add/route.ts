import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { sendSms } from "@/lib/sms"
import { normalizePhone, phoneVariants } from "@/lib/phone"
import { SITE_URL } from "@/lib/site-url"
import { requireAdmin } from "@/lib/require-admin"

const GOOGLE_MAPS_LINK = "https://maps.google.com/?q=Prof+Dr+Eray+Caliskan+Kadin+Hastaliklari+Istanbul"

export async function POST(request: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })

    const { full_name, phone: rawPhone } = await request.json()

    if (!full_name?.trim() || !normalizePhone(rawPhone)) {
      return NextResponse.json({ error: "Ad soyad ve telefon zorunludur" }, { status: 400 })
    }
    const phone = normalizePhone(rawPhone)

    const supabaseAdmin = createServiceRoleClient()

    // Telefon ile mevcut hasta kontrolü
    const { data: existing } = await supabaseAdmin
      .from("patients")
      .select("id, full_name, phone")
      .in("phone", phoneVariants(phone))
      .order("created_at", { ascending: true })
      .limit(1)
      .then((r) => ({ ...r, data: r.data && r.data.length > 0 ? r.data[0] : null }))

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
          phone: phone,
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

    const smsSent = (await sendSms(phone, smsMessage)).sent

    // sent_messages tablosuna kaydet
    await supabaseAdmin.from("sent_messages").insert({
      patient_id: patientId,
      phone_number: phone,
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
