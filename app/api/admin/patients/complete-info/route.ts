import { NextResponse } from "next/server"
import { sendSms } from "@/lib/sms"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { normalizePhone } from "@/lib/phone"
import { requireAdmin } from "@/lib/require-admin"
import { generateVerificationCode } from "@/lib/secure-random"

export async function POST(request: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response

  try {
    const body = await request.json()
    const { patient_id, appointment_id, tc_no, date_of_birth } = body
    const phone = normalizePhone(body.phone)

    if (!patient_id || !tc_no || !phone) {
      return NextResponse.json(
        { error: "Gerekli bilgiler eksik (patient_id, tc_no, phone gerekli)" },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // TC kontrolü - başka bir hastada kullanılıyor mu?
    const { data: existingPatient } = await supabase
      .from("patients")
      .select("id")
      .eq("tc_no", tc_no)
      .neq("id", patient_id)
      .maybeSingle()

    if (existingPatient) {
      return NextResponse.json(
        { error: "Bu TC kimlik numarası başka bir hasta için kullanılıyor" },
        { status: 400 }
      )
    }

    // Hasta bilgilerini güncelle - henüz KVKK onayı yok
    const { error: updateError } = await supabase
      .from("patients")
      .update({
        tc_no,
        phone,
        date_of_birth: date_of_birth || null,
        kvkk_approved: false, // SMS onayı bekliyor
      })
      .eq("id", patient_id)

    if (updateError) {
      console.error("Patient update error:", updateError)
      return NextResponse.json(
        { error: "Hasta bilgileri güncellenemedi" },
        { status: 500 }
      )
    }

    // 6 haneli rastgele kod oluştur
    const verificationCode = generateVerificationCode()

    // Kodu veritabanına kaydet (5 dakika geçerli)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 5)

    const { error: insertError } = await supabase.from("sms_verifications").insert({
      phone: phone,
      code: verificationCode,
      appointment_id: appointment_id,
      expires_at: expiresAt.toISOString(),
      verified: false,
    })

    if (insertError) {
      console.error("SMS verification insert error:", insertError)
      return NextResponse.json(
        { error: "Doğrulama kodu kaydedilemedi" },
        { status: 500 }
      )
    }

    const smsMessage = `KVKK Onay Kodunuz: ${verificationCode}

Kod 5 dakika geçerlidir.
Prof. Dr. Eray Caliskan`
    const sms = await sendSms(phone, smsMessage)

    if (sms.sent) {
      return NextResponse.json({
        success: true,
        message: "SMS gönderildi",
      })
    }

    // SMS ayarı yoksa ya da giriş bilgisi reddedildiyse (geliştirme ortamı) kod personele gösterilir
    if (sms.code === "credentials_missing" || sms.code === "30") {
      return NextResponse.json({
        success: true,
        message: "Development mode - Kod konsola yazdırıldı",
        code: verificationCode,
      })
    }
    throw new Error(`SMS not sent: ${sms.code}`)
  } catch (error) {
    console.error("Complete patient info error:", error)
    return NextResponse.json(
      { error: "Beklenmeyen bir hata oluştu" },
      { status: 500 }
    )
  }
}
