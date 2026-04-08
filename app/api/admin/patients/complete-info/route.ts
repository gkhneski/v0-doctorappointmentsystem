import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { patient_id, appointment_id, tc_no, phone, date_of_birth } = body

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
      console.error("[v0] Patient update error:", updateError)
      return NextResponse.json(
        { error: "Hasta bilgileri güncellenemedi" },
        { status: 500 }
      )
    }

    // 6 haneli rastgele kod oluştur
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

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
      console.error("[v0] SMS verification insert error:", insertError)
      return NextResponse.json(
        { error: "Doğrulama kodu kaydedilemedi" },
        { status: 500 }
      )
    }

    // Netgsm API'sine SMS gönder
    const netgsmUser = process.env.NETGSM_USER
    const netgsmPassword = process.env.NETGSM_PASSWORD
    const netgsmHeader = process.env.NETGSM_HEADER || "SAGLIK"

    if (!netgsmUser || !netgsmPassword) {
      console.log("[v0] Development mode - SMS Doğrulama Kodu:", verificationCode)
      console.log("[v0] Telefon:", phone)

      return NextResponse.json({
        success: true,
        message: "Development mode - Kod konsola yazdırıldı",
        code: verificationCode, // Sadece development için
      })
    }

    const smsMessage = `KVKK Onay Kodunuz: ${verificationCode}\n\nKod 5 dakika geçerlidir.\nProf. Dr. Eray Caliskan`

    const netgsmUrl = `https://api.netgsm.com.tr/sms/send/get/?usercode=${netgsmUser}&password=${netgsmPassword}&gsmno=${phone.replace(/\D/g, "")}&message=${encodeURIComponent(smsMessage)}&msgheader=${netgsmHeader}`

    const response = await fetch(netgsmUrl)
    const responseText = await response.text()

    console.log("[v0] Netgsm Response:", responseText)

    if (responseText.startsWith("00") || responseText.startsWith("01")) {
      return NextResponse.json({
        success: true,
        message: "SMS gönderildi",
      })
    } else {
      // SMS gönderilemedi ama kod oluşturuldu - development için
      if (responseText === "30") {
        console.log("[v0] Netgsm hata - Development kod:", verificationCode)
        return NextResponse.json({
          success: true,
          message: "Development mode - Kod konsola yazdırıldı",
          code: verificationCode,
        })
      }
      throw new Error(`Netgsm error: ${responseText}`)
    }
  } catch (error) {
    console.error("[v0] Complete patient info error:", error)
    return NextResponse.json(
      { error: "Beklenmeyen bir hata oluştu" },
      { status: 500 }
    )
  }
}
