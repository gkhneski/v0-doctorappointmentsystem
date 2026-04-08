import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, newPassword } = await request.json()

    if (!userId || !newPassword) {
      return NextResponse.json({ error: "Kullanıcı ID ve yeni şifre gerekli" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Şifre en az 6 karakter olmalı" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if current user is a doctor (only doctors can reset passwords)
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
      return NextResponse.json({ error: "Sadece doktorlar şifre sıfırlayabilir" }, { status: 403 })
    }

    // Use service role client to update password (requires admin privileges)
    const supabaseAdmin = await createServiceRoleClient()

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (error) {
      console.error("[v0] Password reset error:", error)
      return NextResponse.json({ error: error.message || "Şifre güncellenemedi" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Şifre başarıyla güncellendi" })
  } catch (error: any) {
    console.error("[v0] Reset password error:", error)
    return NextResponse.json({ error: "Sunucu hatası oluştu" }, { status: 500 })
  }
}
