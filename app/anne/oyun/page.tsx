import Link from "next/link"
import { requireReadyUser } from "@/lib/anne/server"
import { questionOfDay } from "@/lib/anne/content/quiz"
import { SOURCES } from "@/lib/anne/content/sources"
import { Blob, Screen, Tabs, TopBar } from "@/components/anne/chrome"
import { QuizCard } from "@/components/anne/quiz-card"

export const dynamic = "force-dynamic"

// Oyun: günün sorusu ve diğer oyunlara geçiş.
export default async function AnneOyunPage() {
  const { today } = await requireReadyUser()
  const question = questionOfDay(today)

  return (
    <Screen>
      <Blob tone="lilac" style={{ left: -80, top: 70, width: 540, height: 470 }} />
      <TopBar title="Oyun" />
      <main className="nb-main">
        <QuizCard key={question.id} question={question} sourceTitle={SOURCES[question.source].citation} />
        <div className="nb-two" style={{ marginTop: 34 }}>
          <Link className="nb-card" data-tone="pink" href="/anne/tekme">
            <h3>Tekme</h3>
            <p style={{ marginTop: 4, fontSize: 14 }}>Dokun, say, kaydet</p>
          </Link>
          <Link className="nb-card" data-tone="peach" href="/anne/isimler">
            <h3>İsim bulucu</h3>
            <p style={{ marginTop: 4, fontSize: 14 }}>Beğen ya da geç</p>
          </Link>
        </div>
        <div className="nb-grow" />
      </main>
      <Tabs current="oyun" />
    </Screen>
  )
}
