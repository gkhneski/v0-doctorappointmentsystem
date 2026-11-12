import Link from "next/link"
import { redirect } from "next/navigation"
import { getAppUser } from "@/lib/anne/server"
import { gestationalAge, todayInIstanbul } from "@/lib/anne/pregnancy"
import { WeekDisplay, dueLine, formatDateTr } from "@/components/anne/week-display"
import { WeekNote } from "@/components/anne/week-note"
import { ScheduleList } from "@/components/anne/schedule-list"

export const dynamic = "force-dynamic"

export default async function AnneAnaPage() {
  const user = await getAppUser()
  if (!user) redirect("/anne/giris")
  if (!user.onboarded_at || !user.lmp_date || !user.due_date) redirect("/anne/baslangic")

  const today = todayInIstanbul()
  const age = gestationalAge(user.lmp_date, today)

  return (
    <main>
      <header className="anne-bar">
        <span className="anne-brand">NeoBreed</span>
        <Link href="/anne/hesap">Hesap</Link>
      </header>

      <p className="anne-note" style={{ marginTop: 28 }}>
        {user.display_name ? `${user.display_name}, bugün ` : "Bugün "}
        {formatDateTr(today)}
      </p>

      {age ? (
        <>
          <WeekDisplay age={age} />

          <section className="anne-section">
            <h2>Gebeliğiniz</h2>
            <dl className="anne-facts">
              <div>
                <dt>Tahmini doğum</dt>
                <dd>{formatDateTr(user.due_date)}</dd>
              </div>
              <div>
                <dt>Doğuma</dt>
                <dd>{dueLine(age)}</dd>
              </div>
              <div>
                <dt>Dönem</dt>
                <dd>{age.trimester}. üç aylık dönem</dd>
              </div>
              <div>
                <dt>Geçen süre</dt>
                <dd>%{age.progressPercent}</dd>
              </div>
            </dl>
          </section>

          <WeekNote week={age.weeks} />
          <ScheduleList lmp={user.lmp_date} week={age.weeks} />

          <section className="anne-section">
            <h2>Ne zaman beklemeden başvurmalı</h2>
            <p>Kanama, su gelmesi, bebek hareketlerinde azalma ve diğer işaretler tek sayfada.</p>
            <Link className="anne-button" data-kind="plain" href="/anne/tehlike-isaretleri">
              <span>Tehlike işaretleri</span>
            </Link>
          </section>
        </>
      ) : (
        <p className="anne-error">
          Kayıtlı tarihiniz bugünden sonra görünüyor. <Link href="/anne/hesap">Hesap sayfasından düzeltin.</Link>
        </p>
      )}

      <footer className="anne-foot">
        <p>
          Hafta,{" "}
          {user.due_date_source === "due" ? "girdiğiniz tahmini doğum tarihinden" : "girdiğiniz son adet tarihinden"}{" "}
          hesaplanır. Doktorunuz farklı bir tarih söylediyse Hesap sayfasından düzeltin.
        </p>
        <p>Acil bir durumda 112 numarasını arayın.</p>
      </footer>
    </main>
  )
}
