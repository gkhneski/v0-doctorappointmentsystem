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

    const updateData: Record<string, string> = {}
    if (tc_no) updateData.tc_no = tc_no
    if (phone) updateData.phone = phone
    if (full_name) updateData.full_name = full_name
    if (date_of_birth) updateData.date_of_birth = date_of_birth

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
