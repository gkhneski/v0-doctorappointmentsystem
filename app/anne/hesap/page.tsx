import Link from "next/link"
import { redirect } from "next/navigation"
import { getAppUser } from "@/lib/anne/server"
import { todayInIstanbul } from "@/lib/anne/pregnancy"
import { StartForm } from "@/components/anne/start-form"
import { AccountActions } from "@/components/anne/account-actions"

export const dynamic = "force-dynamic"

export default async function AnneHesapPage() {
  const user = await getAppUser()
  if (!user) redirect("/anne/giris")
  if (!user.onboarded_at) redirect("/anne/baslangic")

  const kind = user.due_date_source === "due" ? "due" : "lmp"

  return (
    <main>
      <header className="anne-bar">
        <Link className="anne-brand" href="/anne/ana">
          NeoBreed
        </Link>
        <Link href="/anne/ana">Geri</Link>
      </header>

      <h1>Hesap</h1>

      <section className="anne-section">
        <h2>Giriş numarası</h2>
        <p style={{ fontVariantNumeric: "tabular-nums" }}>{user.phone}</p>
      </section>

      <section className="anne-section">
        <h2>Bilgileriniz</h2>
        <StartForm
          today={todayInIstanbul()}
          submitLabel="Değişiklikleri kaydet"
          initial={{
            displayName: user.display_name ?? "",
            kind,
            value: (kind === "due" ? user.due_date : user.lmp_date) ?? "",
          }}
        />
      </section>

      <section className="anne-section">
        <h2>Oturum</h2>
        <AccountActions />
      </section>
    </main>
  )
}
