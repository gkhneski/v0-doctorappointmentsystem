import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/require-admin"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ patientId: string }> }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response

  try {
    const { patientId } = await params
    const supabase = await createClient()

    // Check if patient exists
    const { data: patient, error: fetchError } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .single()

    if (fetchError || !patient) {
      return NextResponse.json({ error: "Hasta bulunamadı" }, { status: 404 })
    }

    // Delete patient (cascade will delete related records)
    const { error: deleteError } = await supabase.from("patients").delete().eq("id", patientId)

    if (deleteError) {
      console.error("Error deleting patient:", deleteError)
      return NextResponse.json({ error: "Hasta silinirken bir hata oluştu" }, { status: 500 })
    }

    console.log(`Patient deleted successfully: ${patientId}`)

    // Revalidate the patients page to clear cache
    revalidatePath("/admin/patients")

    return NextResponse.json({
      success: true,
      message: "Hasta başarıyla silindi",
    })
  } catch (error) {
    console.error("Error in patient delete API:", error)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
