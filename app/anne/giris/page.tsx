import Link from "next/link"
import { redirect } from "next/navigation"
import { getAppUser } from "@/lib/anne/server"
import { Blob, Screen, TopBar } from "@/components/anne/chrome"
import { LoginForm } from "@/components/anne/login-form"

export const dynamic = "force-dynamic"

export default async function AnneGirisPage() {
  const user = await getAppUser()
  if (user) redirect(user.onboarded_at ? "/anne/ana" : "/anne/baslangic")

  return (
    <Screen>
      <Blob style={{ right: -160, bottom: -96, width: 360, height: 420 }} />
      <Blob tone="lilac" style={{ left: -120, bottom: -96, width: 320, height: 300 }} />
      <TopBar>
        <Link className="nb-skip" href="/anne">
          Geri
        </Link>
      </TopBar>
      <main className="nb-main">
        <LoginForm />
      </main>
    </Screen>
  )
}
