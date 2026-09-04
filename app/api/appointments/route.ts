import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

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
    } = body

    console.log("[v0] Creating appointment:", {
      doctor_id,
      appointment_date,
      appointment_time,
      patient_name,
    })

    console.log("[v0] Female history received:", female_history)
    console.log("[v0] Male history received:", male_history)
    console.log("[v0] Referral doctor:", referral_doctor)
    console.log("[v0] Medical documents:", medical_documents)

    const supabase = createServiceRoleClient()

    // Check if same slot is already taken
    const { data: existingAppointment } = await supabase
      .from("appointments")
      .select("id")
      .eq("doctor_id", doctor_id)
      .eq("appointment_date", appointment_date)
      .eq("appointment_time", appointment_time)
      .maybeSingle()

    if (existingAppointment) {
      return NextResponse.json({ error: "Bu randevu saati dolu. Lütfen başka bir saat seçin." }, { status: 409 })
    }

    // Check if patient already has an appointment this week
    const appointmentDate = new Date(appointment_date)
    const dayOfWeek = appointmentDate.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Get Monday
    const weekStart = new Date(appointmentDate)
    weekStart.setDate(appointmentDate.getDate() + diff)
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const { data: sameWeekAppointments } = await supabase
      .from("appointments")
      .select("id, appointment_date, appointment_time, patients!inner(tc_no)")
      .eq("patients.tc_no", patient_tc_no)
      .gte("appointment_date", weekStart.toISOString().split("T")[0])
      .lte("appointment_date", weekEnd.toISOString().split("T")[0])
      .neq("status", "cancelled")

    if (sameWeekAppointments && sameWeekAppointments.length > 0) {
      const existing = sameWeekAppointments[0]
      const existingDate = new Date(existing.appointment_date).toLocaleDateString("tr-TR")
      return NextResponse.json(
        {
          error: "duplicate_appointment",
          message: `Bu hasta ${existingDate} tarihinde zaten randevusu var. Acil durum için lütfen aşağıdaki numaralardan iletişime geçin:\n\nSekreter: 0531 080 4720\nHemşire: 0533 142 7261`,
          existing_appointment: {
            date: existingDate,
            time: existing.appointment_time,
          },
        },
        { status: 409 }
      )
    }

    // Check if patient is blacklisted by TC or phone
    const { data: blacklistedPatients } = await supabase
      .from("patients")
      .select("tc_no, phone")
      .eq("is_blacklisted", true)

    const isBlacklisted = blacklistedPatients?.some(
      (patient) => patient.tc_no === patient_tc_no || patient.phone === patient_phone
    )

    if (isBlacklisted) {
      console.log("[v0] Blacklisted patient attempted to book:", { tc_no: patient_tc_no, phone: patient_phone })
      return Response.json(
        {
          error: "Sistem arızası nedeniyle şu anda randevu verilememiştir. Lütfen daha sonra tekrar deneyiniz.",
        },
        { status: 403 }
      )
    }

    const { data: existingPatient } = await supabase
      .from("patients")
      .select("id")
      .eq("tc_no", patient_tc_no)
      .maybeSingle()

    let patientId: string

    if (existingPatient) {
      patientId = existingPatient.id
      const { error: updateError } = await supabase
        .from("patients")
        .update({
          full_name: patient_name,
          phone: patient_phone,
          date_of_birth: patient_dob,
          kvkk_approved,
        })
        .eq("id", patientId)

      if (updateError) {
        console.error("[v0] Error updating patient:", updateError)
        throw updateError
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

      if (insertError || !newPatient) {
        console.error("[v0] Error creating patient:", insertError)
        throw insertError
      }

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
        notes: `Randevu Tipi: ${appointment_type}`,
      })
      .select("id")
      .single()

    if (appointmentError || !appointment) {
      console.error("[v0] Error creating appointment:", appointmentError)
      throw appointmentError
    }

    const { error: formError } = await supabase.from("appointment_forms").insert({
      appointment_id: appointment.id,
      form_data: {
        ...female_history,
        ...male_history,
        appointment_type,
        referral_doctor,
        medical_documents,
      },
    })

    if (formError) {
      console.error("[v0] Error saving form data:", formError)
    } else {
      console.log("[v0] Form data saved to appointment_forms table")
    }

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

    if (smsError) {
      console.error("[v0] Error storing verification code:", smsError)
      throw smsError
    }

    console.log("[v0] SMS verification record created:", {
      id: smsVerification.id,
      appointment_id: smsVerification.appointment_id,
      code: smsVerification.code,
    })

    let smsStatus = "sent"
    let devCode: string | undefined

    try {
      const netgsmUser = process.env.NETGSM_USER
      const netgsmPassword = process.env.NETGSM_PASSWORD
      const netgsmHeader = process.env.NETGSM_HEADER

      if (netgsmUser && netgsmPassword && netgsmHeader) {
        // NetGSM requires phone without leading 0 (e.g., 5331234567 not 05331234567)
        const formattedPhone = patient_phone.startsWith("0") ? patient_phone.slice(1) : patient_phone
        const smsMessage = `Dogrulama kodunuz: ${verificationCode}. Bu kodu randevu islemini tamamlamak icin kullanin.`
        const smsUrl = `https://api.netgsm.com.tr/sms/send/get?usercode=${netgsmUser}&password=${netgsmPassword}&gsmno=${formattedPhone}&message=${encodeURIComponent(smsMessage)}&msgheader=${netgsmHeader}`
        
        console.log("[v0] Sending SMS to:", formattedPhone)

        const smsResponse = await fetch(smsUrl)
        const smsResult = await smsResponse.text()

        console.log("[v0] NetGSM SMS response:", smsResult)
        console.log("[v0] NetGSM SMS status:", smsResponse.status)
        
        // NetGSM success codes: 00 (başarılı), 01 (mesaj kuyrukta)
        // Error codes: 20 (mesaj metninde hata), 30 (geçersiz kullanıcı/şifre), 40 (mesaj başlığı onaysız), 50 (eksik parametre)
        if (!smsResult.startsWith("00") && !smsResult.startsWith("01")) {
          console.error("[v0] SMS failed with code:", smsResult)
          console.error("[v0] SMS failed - returning dev code")
          smsStatus = "failed"
          devCode = verificationCode
        } else {
          console.log("[v0] SMS sent successfully!")
        }
      } else {
        console.log("[v0] NetGSM credentials not configured, SMS not sent")
        console.log("[v0] Verification code (dev mode):", verificationCode)
        smsStatus = "dev_mode"
        devCode = verificationCode
      }
    } catch (smsError) {
      console.error("[v0] Error sending SMS:", smsError)
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
