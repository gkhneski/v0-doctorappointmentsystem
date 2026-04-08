import { createClient } from "@/lib/supabase/server"

export async function getCurrentUser() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get admin user details including role
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", user.id)
    .single()

  return adminUser
}

export async function isDoctor() {
  const user = await getCurrentUser()
  return user?.role === "doktor"
}

export async function canManageStaff() {
  return await isDoctor()
}
