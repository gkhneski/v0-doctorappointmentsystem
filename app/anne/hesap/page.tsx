import Link from "next/link"
import { redirect } from "next/navigation"
import { appDb, getAppUser } from "@/lib/anne/server"
import { latestConsents } from "@/lib/anne/consents"
import { todayInIstanbul } from "@/lib/anne/pregnancy"
import { DANGER_SIGNS } from "@/lib/anne/content/danger-signs"
import { Blob, Screen, TopBar } from "@/components/anne/chrome"
import { StartForm } from "@/components/anne/start-form"
import { AccountActions } from "@/components/anne/account-actions"
import { ThemePicker } from "@/components/anne/theme-picker"
import { isTheme } from "@/lib/anne/look"

export const dynamic = "force-dynamic"

export default async function AnneHesapPage() {
  const user = await getAppUser()
  if (!user) redirect("/anne/giris")
  if (!user.onboarded_at) redirect("/anne/baslangic")

  const consents = await latestConsents(appDb(), user.id)
  const kind = user.due_date_source === "due" ? "due" : "lmp"
  const answer = (given: boolean) => (given ? "Verildi" : "Verilmedi")

  return (
    <Screen>
      <Blob tone="lilac" style={{ right: -130, top: -70, width: 320, height: 290 }} />
      <TopBar title="Hesap">
        <Link className="nb-skip" href="/anne/ana">
          Kapat
        </Link>
      </TopBar>
      <main className="nb-main">
        <div className="nb-card" style={{ marginTop: 22, padding: "6px 18px" }}>
          <div className="nb-row">
            <span>Telefon</span>
            <b style={{ fontVariantNumeric: "tabular-nums" }}>{user.phone}</b>
          </div>
        </div>

        <div className="nb-card" style={{ padding: "4px 18px 18px" }}>
          <StartForm
            today={todayInIstanbul()}
            submitLabel="Değişiklikleri kaydet"
            next="/anne/hesap"
            initial={{
              displayName: user.display_name ?? "",
              kind,
              value: (kind === "due" ? user.due_date : user.lmp_date) ?? "",
            }}
          />
        </div>

        <div className="nb-card" style={{ padding: "14px 18px 16px" }}>
          <h3>Renkler</h3>
          <p className="nb-note" style={{ marginTop: 4 }}>
            Bebeğinin yüzünü üretirken seçtiğin cinsiyete göre pembe ya da mavi olur. İstersen kendin seç.
          </p>
          <ThemePicker choice={isTheme(user.theme) ? user.theme : null} />
        </div>

        <div className="nb-card" style={{ padding: "14px 18px 6px" }}>
          <h3>Onaylarım</h3>
          <div className="nb-row">
            <span style={{ color: "var(--ink)" }}>Aydınlatma metni</span>
            <b>{answer(consents.aydinlatma)}</b>
          </div>
          <div className="nb-row">
            <span style={{ color: "var(--ink)" }}>Sağlık verisi açık rızası</span>
            <b>{answer(consents.saglik_verisi)}</b>
          </div>
          <div className="nb-row">
            <span style={{ color: "var(--ink)" }}>Hatırlatma bildirimi</span>
            <b>{answer(consents.bildirim)}</b>
          </div>
          <div className="nb-row">
            <Link href="/anne/onay">Onayları değiştir</Link>
          </div>
        </div>

        <Link className="nb-card nb-row-card" data-tone="pink" href="/anne/tehlike-isaretleri" style={{ padding: "14px 18px" }}>
          <b>Ne zaman doktora gitmeliyim?</b>
          <span className="nb-chip" data-on="">
            {DANGER_SIGNS.length} işaret
          </span>
        </Link>

        <AccountActions />
      </main>
    </Screen>
  )
}
