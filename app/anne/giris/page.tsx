import Link from "next/link"
import { redirect } from "next/navigation"
import { getAppUser } from "@/lib/anne/server"
import { LoginForm } from "@/components/anne/login-form"

export const dynamic = "force-dynamic"

export default async function AnneGirisPage() {
  const user = await getAppUser()
  if (user) redirect(user.onboarded_at ? "/anne/ana" : "/anne/baslangic")

  return (
    <main>
      <header className="anne-bar">
        <Link className="anne-brand" href="/anne">
          NeoBreed
        </Link>
      </header>

      <h1>Giriş</h1>
      <p className="anne-lead">Şifre yok. Telefonunuza gelen kodla girersiniz; ilk girişinizde hesabınız açılır.</p>

      <LoginForm />
    </main>
  )
}
