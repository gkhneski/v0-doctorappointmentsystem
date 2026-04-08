import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      doctor_id,
      appointment_date,
      appointment_time,
      appointment_type,
      patient_tc_no,
      patient_name,
      patient_phone,
      patient_dob,
      referral_doctor,
      female_history,
      male_history,
      kvkk_approved,
      medical_documents,
      fetal_bebek_sayisi,
    } = body

    const supabase = createServiceRoleClient()

    // Calculate week range for duplicate check
    const appointmentDate = new Date(appointment_date)
    const dayOfWeek = appointmentDate.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const weekStart = new Date(appointmentDate)
    weekStart.setDate(appointmentDate.getDate() + diff)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    // Run all pre-checks in parallel
    const [
      { data: existingAppointment },
      { data: sameWeekAppointments },
      { data: blacklistedPatient },
      { data: existingPatient },
    ] = await Promise.all([
      // 1. Slot conflict
      supabase
        .from("appointments")
        .select("id")
        .eq("doctor_id", doctor_id)
        .eq("appointment_date", appointment_date)
        .eq("appointment_time", appointment_time)
        .maybeSingle(),

      // 2. Same week duplicate
      supabase
        .from("appointments")
        .select("id, appointment_date, appointment_time, patients!inner(tc_no)")
        .eq("patients.tc_no", patient_tc_no)
        .gte("appointment_date", weekStart.toISOString().split("T")[0])
        .lte("appointment_date", weekEnd.toISOString().split("T")[0])
        .neq("status", "cancelled"),

      // 3. Blacklist check - query directly instead of fetching all
      supabase
        .from("patients")
        .select("id")
        .eq("is_blacklisted", true)
        .or(`tc_no.eq.${patient_tc_no},phone.eq.${patient_phone}`)
        .maybeSingle(),

      // 4. Existing patient lookup
      supabase
        .from("patients")
        .select("id")
        .eq("tc_no", patient_tc_no)
        .maybeSingle(),
    ])

    if (existingAppointment) {
      return NextResponse.json({ error: "Bu randevu saati dolu. Lütfen başka bir saat seçin." }, { status: 409 })
    }

    if (sameWeekAppointments && sameWeekAppointments.length > 0) {
      const existing = sameWeekAppointments[0]
      const existingDate = new Date(existing.appointment_date).toLocaleDateString("tr-TR")
      return NextResponse.json(
        {
          error: "duplicate_appointment",
          message: `Bu hasta ${existingDate} tarihinde zaten randevusu var. Acil durum için lütfen aşağıdaki numaralardan iletişime geçin:\n\nSekreter: 0531 080 4720\nHemşire: 0533 142 7261`,
          existing_appointment: { date: existingDate, time: existing.appointment_time },
        },
        { status: 409 }
      )
    }

    if (blacklistedPatient) {
      return Response.json(
        { error: "Sistem arızası nedeniyle şu anda randevu verilememiştir. Lütfen daha sonra tekrar deneyiniz." },
        { status: 403 }
      )
    }

    let patientId: string

    if (existingPatient) {
      patientId = existingPatient.id
      // Mevcut hastayı güncelle — sadece değişen alanları güncelle,
      // date_of_birth zaten doğruysa üzerine yazma (unique constraint hatası önleme)
      const updatePayload: Record<string, string | boolean> = {
        full_name: patient_name,
        phone: patient_phone,
        kvkk_approved,
      }
      // Doğum tarihi farklıysa güncelle, aynıysa dokunma
      if (patient_dob) {
        updatePayload.date_of_birth = patient_dob
      }

      const { error: updateError } = await supabase
        .from("patients")
        .update(updatePayload)
        .eq("id", patientId)

      if (updateError) {
        // Unique constraint hatası — yine de devam et, hasta zaten sistemde var
        console.error("[v0] Patient update warning (non-blocking):", updateError.message)
      }
    } else {
      const { data: newPatient, error: insertError } = await supabase
        .from("patients")
        .insert({
          tc_no: patient_tc_no,
          full_name: patient_name,
          phone: patient_phone,
          date_of_birth: patient_dob,
          kvkk_approved,
        })
        .select("id")
        .single()

      if (insertError || !newPatient) throw insertError

      patientId = newPatient.id
    }

    // Generate unique confirmation token
    const confirmationToken = Math.random().toString(36).substring(2) + Date.now().toString(36)

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        patient_id: patientId,
        doctor_id,
        appointment_date,
        appointment_time,
        status: "scheduled",
        confirmation_status: "pending",
        confirmation_token: confirmationToken,
        appointment_type: appointment_type,
        fetal_bebek_sayisi: fetal_bebek_sayisi || null,
        notes: `Randevu Tipi: ${appointment_type}${fetal_bebek_sayisi ? ` (${fetal_bebek_sayisi === "tek" ? "Tek Bebek" : fetal_bebek_sayisi === "ikiz" ? "Ikiz Bebek" : "Ucuz Bebek"})` : ""}`,
      })
      .select("id")
      .single()

    if (appointmentError || !appointment) throw appointmentError

    await supabase.from("appointment_forms").insert({
      appointment_id: appointment.id,
      form_data: {
        ...female_history,
        ...male_history,
        appointment_type,
        referral_doctor,
        medical_documents,
      },
    })

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    const { data: smsVerification, error: smsError } = await supabase
      .from("sms_verifications")
      .insert({
        appointment_id: appointment.id,
        phone: patient_phone,
        code: verificationCode,
        verified: false,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      .select("*")
      .single()

    if (smsError) throw smsError

    let smsStatus = "sent"
    let devCode: string | undefined

    try {
      const netgsmUser = process.env.NETGSM_USER
      const netgsmPassword = process.env.NETGSM_PASSWORD
      const netgsmHeader = process.env.NETGSM_HEADER

      if (netgsmUser && netgsmPassword && netgsmHeader) {
        const formattedPhone = patient_phone.startsWith("0") ? patient_phone.slice(1) : patient_phone
        const smsMessage = `Dogrulama kodunuz: ${verificationCode}. Bu kodu randevu islemini tamamlamak icin kullanin.`
        const smsUrl = `https://api.netgsm.com.tr/sms/send/get?usercode=${netgsmUser}&password=${netgsmPassword}&gsmno=${formattedPhone}&message=${encodeURIComponent(smsMessage)}&msgheader=${netgsmHeader}`
        const smsResponse = await fetch(smsUrl)
        const smsResult = await smsResponse.text()
        if (!smsResult.startsWith("00") && !smsResult.startsWith("01")) {
          smsStatus = "failed"
          devCode = verificationCode
        }
      } else {
        smsStatus = "dev_mode"
        devCode = verificationCode
      }
    } catch {
      smsStatus = "error"
      devCode = verificationCode
    }

    return NextResponse.json({
      success: true,
      appointmentId: appointment.id,
      message: "Randevu oluşturuldu. Lütfen telefonunuza gelen doğrulama kodunu girin.",
      smsStatus,
      devCode, // Only included in dev/error cases
    })
  } catch (error) {
    console.error("[v0] Error in POST /api/appointments:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Randevu oluşturulurken bir hata oluştu" },
      { status: 500 },
    )
  }
}
