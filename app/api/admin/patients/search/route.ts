import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .single()

    if (!adminUser) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ patients: [] })
    }

    const serviceSupabase = createServiceRoleClient()

    // TC ile tam eşleşme veya isimde kısmi arama
    const { data: patients, error } = await serviceSupabase
      .from("patients")
      .select("id, full_name, phone, tc_no, date_of_birth")
      .or(`tc_no.eq.${query},full_name.ilike.%${query}%,phone.eq.${query}`)
      .eq("is_blacklisted", false)
      .order("full_name")
      .limit(10)

    if (error) {
      console.error("[v0] Patient search error:", error)
      return NextResponse.json({ error: "Arama sırasında hata oluştu" }, { status: 500 })
    }

    return NextResponse.json({ patients: patients || [] })
  } catch (error) {
    console.error("[v0] Patient search route error:", error)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
