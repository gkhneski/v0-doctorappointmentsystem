import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params
    const body = await request.json()
    const { tc_no, phone, full_name, date_of_birth } = body

    const supabase = createServiceRoleClient()

    // Once hastanin mevcut TC'sini kontrol et — TEMP_ ise gercek TC'ye donustur
    const { data: existingPatient } = await supabase
      .from("patients")
      .select("tc_no")
      .eq("id", patientId)
      .single()

    const updateData: Record<string, string | boolean> = {}
    
    // TC guncelleniyor ve mevcut TC TEMP_ ile basliyorsa, gercek TC'ye donustur
    if (tc_no && existingPatient?.tc_no?.startsWith("TEMP_")) {
      console.log(`[v0] Converting TEMP TC ${existingPatient.tc_no} to real TC ${tc_no}`)
      updateData.tc_no = tc_no
      updateData.is_intermediate = false // Artik bilgiler tam — intermediate degil
    } else if (tc_no) {
      updateData.tc_no = tc_no
    }

    if (phone && phone !== "0000000000") updateData.phone = phone
    if (full_name) updateData.full_name = full_name
    if (date_of_birth && date_of_birth !== "1900-01-01") updateData.date_of_birth = date_of_birth

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Guncellenecek veri bulunamadi" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("patients")
      .update(updateData)
      .eq("id", patientId)
      .select()

    if (error) {
      console.error("[v0] Error updating patient:", error)
      
      // Eger unique constraint hatasi varsa detayli mesaj don
      if (error.code === "23505" && error.message.includes("tc_no")) {
        return NextResponse.json(
          { error: "Bu TC kimlik numarasi sistemde zaten kayitli. Lutfen kontrol edin." },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: "Hasta bilgileri guncellenemedi" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Hasta bilgileri guncellendi",
      data,
    })
  } catch (error) {
    console.error("[v0] Error in update patient:", error)
    return NextResponse.json(
      { error: "Beklenmeyen bir hata olustu" },
      { status: 500 }
    )
  }
}
