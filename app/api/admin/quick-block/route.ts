import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { full_name, appointment_date, appointment_time, appointment_type, print_type, notes, is_intermediate = false } = body

    if (!full_name || !appointment_date || !appointment_time) {
      return NextResponse.json(
        { error: "Eksik bilgi" },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Önce geçici hasta kaydı oluştur (TC ve telefon olmadan, KVKK onaysız)
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .insert({
        full_name,
        tc_no: `TEMP_${Date.now()}`, // Geçici TC
        phone: "0000000000", // Geçici telefon
        date_of_birth: "1900-01-01", // Geçici doğum tarihi
        kvkk_approved: false, // Henüz onay yok
        kvkk_approved_at: null,
        kvkk_approved_via: null,
      })
      .select()
      .single()

    if (patientError || !patient) {
      console.error("[v0] Patient creation error:", patientError)
      return NextResponse.json(
        { error: "Hasta kaydı oluşturulamadı" },
        { status: 500 }
      )
    }

    // Default doktor ID'sini al (Prof. Dr. Eray Çalışkan)
    const { data: doctor } = await supabase
      .from("doctors")
      .select("id")
      .limit(1)
      .single()

    // Randevu oluştur - awaiting_details durumunda
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        patient_id: patient.id,
        doctor_id: doctor?.id,
        appointment_date,
        appointment_time,
        status: "confirmed", // Onaylanmış ama bilgiler eksik
        confirmation_status: "pending",
        notes: notes || (is_intermediate ? "Ara slot randevusu" : "Ajanda bloke - Hasta gelince bilgiler tamamlanacak"),
        appointment_type: appointment_type || "kontrol-takip",
        print_type: print_type || null, // Yazdırma tipi
        is_intermediate: is_intermediate, // Ara slot ise hastalara görünmez
      })
      .select()
      .single()

    if (appointmentError) {
      console.error("[v0] Appointment creation error:", appointmentError)
      return NextResponse.json(
        { error: "Randevu oluşturulamadı" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Randevu bloke edildi",
      data: { appointment, patient },
    })
  } catch (error) {
    console.error("[v0] Quick block error:", error)
    return NextResponse.json(
      { error: "Beklenmeyen bir hata oluştu" },
      { status: 500 }
    )
  }
}
