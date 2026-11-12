import { NextResponse } from "next/server"
import { sendSms } from "@/lib/sms"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { resolvePatient, PENDING_PATIENT_KEY } from "@/lib/resolve-patient"
import {
  PUBLIC_REFUSAL_MESSAGE,
  SMS_FAILED_MESSAGE,
  initialStatus,
  purgeStaleUnverified,
  smsOutcome,
} from "@/lib/public-booking"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { normalizePhone, phoneVariants } from "@/lib/phone"
import { validatePublicBooking } from "@/lib/validate-booking"
import { generateUrlToken, generateVerificationCode } from "@/lib/secure-random"

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
      patient_phone: rawPatientPhone,
      patient_dob,
      referral_doctor,
      female_history,
      male_history,
      kvkk_approved,
      medical_documents,
      fetal_bebek_sayisi,
      created_by_admin,
    } = body
    const patient_phone = normalizePhone(rawPatientPhone) || String(rawPatientPhone || "")

    let isVerifiedAdmin = false
    if (created_by_admin === true) {
      const authClient = await createClient()
      const {
        data: { user },
      } = await authClient.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: "Yetkisiz admin işlemi" }, { status: 401 })
      }

      const { data: adminUser } = await authClient
        .from("admin_users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle()

      if (!adminUser) {
        return NextResponse.json({ error: "Yetkisiz admin işlemi" }, { status: 403 })
      }

      isVerifiedAdmin = true
    }

    // Public (admin olmayan) randevu isteklerine spam korumasi: her IP icin
    // saatte en fazla 10 randevu denemesi. Admin panelini etkilemez.
    if (!isVerifiedAdmin) {
      const ip = getClientIp(request)
      const allowed = await checkRateLimit(`appt:ip:${ip}`, 10, 3600)
      if (!allowed) {
        return NextResponse.json(
          { error: "Cok fazla randevu istegi. Lutfen bir sure sonra tekrar deneyin." },
          { status: 429 },
        )
      }

      // Serbest metin alanlari (ad, randevu turu) personel ekranlarinda gosterildigi icin
      // herkese acik istekte dogrulanir. Personelin actigi randevular etkilenmez.
      const invalid = validatePublicBooking({ patient_name, appointment_type })
      if (invalid) {
        return NextResponse.json({ error: invalid }, { status: 400 })
      }
    }

    const supabase = createServiceRoleClient()

    // Kodu dogrulanmadan birakilmis herkese acik randevular saati tutmaya devam etmesin.
    await purgeStaleUnverified(supabase)

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
      { data: availableSchedule },
    ] = await Promise.all([
      // 1. Slot conflict
      supabase
        .from("appointments")
        .select("id, status")
        .eq("doctor_id", doctor_id)
        .eq("appointment_date", appointment_date)
        .eq("appointment_time", appointment_time)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),

      // 2. Same week duplicate
      supabase
        .from("appointments")
        .select("id, appointment_date, appointment_time, patients!inner(tc_no)")
        .eq("patients.tc_no", patient_tc_no)
        .gte("appointment_date", weekStart.toISOString().split("T")[0])
        .lte("appointment_date", weekEnd.toISOString().split("T")[0])
        .neq("status", "cancelled"),

      // 3. Blacklist check - TC veya telefonun herhangi bir yazilisi
      //    (birden fazla eslesmede de calismasi icin limit(1), maybeSingle degil)
      supabase
        .from("patients")
        .select("id")
        .eq("is_blacklisted", true)
        .or(
          [
            `tc_no.eq.${String(patient_tc_no || "").replace(/[^A-Za-z0-9_-]/g, "")}`,
            ...phoneVariants(patient_phone).map((p) => `phone.eq.${p.replace(/[^0-9+]/g, "")}`),
          ].join(","),
        )
        .limit(1)
        .then((r) => ({ ...r, data: r.data && r.data.length > 0 ? r.data[0] : null })),

      // 4. Gün yeni randevu alımına açık mı?
      supabase
        .from("doctor_schedules")
        .select("id")
        .eq("doctor_id", doctor_id)
        .eq("schedule_date", appointment_date)
        .eq("is_active", true)
        .eq("is_available", true)
        .limit(1),
    ])

    if (!availableSchedule?.length) {
      return NextResponse.json(
        { error: "Bu gün yeni randevu alımına kapalı. Acil durumlar için lütfen kliniğimizi arayın." },
        { status: 409 },
      )
    }

    if (existingAppointment) {
      // İptal edilmiş bir randevu slotu doldurmuş olabilir. Bu slotu SADECE admin
      // yeniden atayabilir (public tarafta dolu kalır ki hasta kendi kafasına göre alamasın).
      // Audit kanıtı zaten kalıcı olduğu için iptal kaydını silip yeni randevuyu üzerine açıyoruz.
      if (existingAppointment.status === "cancelled" && isVerifiedAdmin) {
        await supabase.from("appointments").delete().eq("id", existingAppointment.id)
      } else {
        return NextResponse.json({ error: "Bu randevu saati dolu. Lütfen başka bir saat seçin." }, { status: 409 })
      }
    }

    if (!isVerifiedAdmin && sameWeekAppointments && sameWeekAppointments.length > 0) {
      // Hangi TC'nin ne zaman randevusu oldugu disariya soylenmez (kara listeyle ayni yanit).
      return NextResponse.json({ error: PUBLIC_REFUSAL_MESSAGE }, { status: 409 })
    }

    if (blacklistedPatient) {
      if (!isVerifiedAdmin) {
        return NextResponse.json({ error: PUBLIC_REFUSAL_MESSAGE }, { status: 409 })
      }
      return Response.json(
        { error: "Sistem arızası nedeniyle şu anda randevu verilememiştir. Lütfen daha sonra tekrar deneyiniz." },
        { status: 403 }
      )
    }

    // Hasta kaydını çöz: gerçek TC → aynı telefonlu geçici kaydı yükselt → yeni kayıt
    // (duplicate oluşmasını engeller)
    // Telefon basina sinir: ayni numaraya saatte en cok 3 dogrulama SMS'i. Yalnizca SMS
    // gonderilecek noktada sayilir; dolu saat ya da gecersiz ad gibi hatalar hakki tuketmez.
    // (Altyapi hatasinda gecirir; gercek hasta engellenmesin.)
    if (!isVerifiedAdmin) {
      const phoneKey = normalizePhone(rawPatientPhone)
      if (phoneKey && !(await checkRateLimit(`appt:phone:${phoneKey}`, 3, 3600))) {
        return NextResponse.json(
          { error: "Cok fazla randevu istegi. Lutfen bir sure sonra tekrar deneyin." },
          { status: 429 },
        )
      }
    }

    // Herkese acik yolda MEVCUT kayit degistirilmez; degisiklik kod dogrulaninca uygulanir.
    const patient = await resolvePatient(
      supabase,
      {
        tc_no: patient_tc_no,
        full_name: patient_name,
        phone: patient_phone,
        date_of_birth: patient_dob,
        kvkk_approved,
      },
      { defer: !isVerifiedAdmin },
    )
    const patientId = patient.id

    // Generate unique confirmation token
    const confirmationToken = generateUrlToken()

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        patient_id: patientId,
        doctor_id,
        appointment_date,
        appointment_time,
        status: initialStatus(isVerifiedAdmin),
        confirmation_status: "pending",
        confirmation_token: confirmationToken,
        appointment_type: appointment_type,
        fetal_bebek_sayisi: fetal_bebek_sayisi || null,
        // Not alani bos birakilir; randevu tipi zaten appointment_type kolonunda tutuluyor.
        // Boylece adminler kendi notlarini yazarken onceden dolu metni silmek zorunda kalmaz.
        notes: null,
      })
      .select("id")
      .single()

    if (appointmentError || !appointment) throw appointmentError

    const { error: formError } = await supabase.from("appointment_forms").insert({
      appointment_id: appointment.id,
      form_data: {
        ...female_history,
        ...male_history,
        appointment_type,
        referral_doctor,
        medical_documents,
        ...(patient.pending ? { [PENDING_PATIENT_KEY]: patient.pending } : {}),
      },
    })

    // Form, bekleyen hasta degisikligini (yeni telefon vb.) tasiyor. Yazilamadiysa randevu
    // onaylansa bile SMS'ler eski numaraya giderdi; bu yuzden randevu geri alinir.
    if (formError && patient.pending) {
      console.error("Appointment form insert failed:", formError.message)
      await supabase.from("appointments").delete().eq("id", appointment.id)
      return NextResponse.json({ error: "Randevu oluşturulurken bir hata oluştu" }, { status: 500 })
    }

    const verificationCode = generateVerificationCode()

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

    const smsMessage = `Dogrulama kodunuz: ${verificationCode}. Bu kodu randevu islemini tamamlamak icin kullanin.`
    const sms = await sendSms(patient_phone, smsMessage)
    const smsStatus = sms.sent
      ? "sent"
      : sms.code === "credentials_missing"
        ? "dev_mode"
        : sms.code === "network_error"
          ? "error"
          : "failed"

    const outcome = smsOutcome(isVerifiedAdmin, smsStatus === "sent", verificationCode)
    if (outcome.action === "rollback") {
      // Herkese acik yolda kod yanita konmaz; SMS gitmediyse randevu saati tutmasin.
      await supabase.from("appointments").delete().eq("id", appointment.id)
      if (patient.created) await supabase.from("patients").delete().eq("id", patientId)
      return NextResponse.json({ error: SMS_FAILED_MESSAGE }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      appointmentId: appointment.id,
      message: "Randevu oluşturuldu. Lütfen telefonunuza gelen doğrulama kodunu girin.",
      smsStatus,
      devCode: outcome.devCode, // Yalnizca personele, SMS gitmediyse
    })
  } catch (error) {
    console.error("Error in POST /api/appointments:", error)
    return NextResponse.json(
      { error: "Randevu oluşturulurken bir hata oluştu" },
      { status: 500 },
    )
  }
}
