import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  try {
    const { userId, full_name, email, role, password } = await request.json()

    console.log("[v0] Update request received:", { userId, full_name, email, role, hasPassword: !!password })

    if (!userId) {
      return NextResponse.json({ error: "Kullanıcı ID gerekli" }, { status: 400 })
    }

    if (!full_name || !email || !role) {
      return NextResponse.json({ error: "Tüm alanlar gerekli" }, { status: 400 })
    }

    if (!["doktor", "sekreter", "hemsire"].includes(role)) {
      return NextResponse.json({ error: "Geçersiz rol" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if current user is a doctor (only doctors can edit staff)
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { data: currentAdminUser } = await supabase
      .from("admin_users")
      .select("role")
      .eq("id", currentUser.id)
      .single()

    if (currentAdminUser?.role !== "doktor") {
      return NextResponse.json({ error: "Sadece doktorlar personel düzenleyebilir" }, { status: 403 })
    }

    // Use service role client for admin operations (bypasses RLS)
    const supabaseAdmin = await createServiceRoleClient()

    // Update admin_users table
    console.log("[v0] Updating admin_users with:", { full_name, email, role, userId })
    
    const { data: updateResult, error: dbError } = await supabaseAdmin
      .from("admin_users")
      .update({
        full_name,
        email,
        role,
      })
      .eq("id", userId)
      .select()

    console.log("[v0] Update result:", { updateResult, dbError })

    if (dbError) {
      console.error("[v0] Database update error:", dbError)
      return NextResponse.json({ error: "Veritabanı güncellenemedi" }, { status: 400 })
    }

    // Always update user metadata with full name (for display name in Supabase dashboard)
    const updateData: any = {
      user_metadata: {
        full_name,
        display_name: full_name,
      },
    }

    // Update email in auth if changed
    if (email) {
      updateData.email = email
    }

    // Update password if provided
    if (password && password.length >= 6) {
      updateData.password = password
    }

    console.log("[v0] Updating auth user with:", updateData)

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData)

    if (authError) {
      console.error("[v0] Auth update error:", authError)
      // Don't fail completely if auth update fails, just log it
    } else {
      console.log("[v0] Auth user updated successfully")
    }

    return NextResponse.json({ success: true, message: "Personel başarıyla güncellendi" })
  } catch (error: any) {
    console.error("[v0] Update staff error:", error)
    return NextResponse.json({ error: "Sunucu hatası oluştu" }, { status: 500 })
  }
}
