import { appDb, requireReadyUser } from "@/lib/anne/server"
import { Blob, Screen, Tabs, TopBar } from "@/components/anne/chrome"
import { SOURCES } from "@/lib/anne/content/sources"
import { QuestionBank } from "@/components/anne/question-bank"
import { VisitQuestions, type VisitQuestion } from "@/components/anne/visit-questions"

export const dynamic = "force-dynamic"

// Sor: Bakanlık kaynaklı hazır sorular ve yanıtları (soru bankası), altında vizitede sorulacaklar
// listesi. Uygulama kendi başına tıbbi yanıt üretmez.
export default async function AnneSorPage() {
  const { user } = await requireReadyUser()

  const { data } = await appDb()
    .from("app_visit_questions")
    .select("id, body, asked_at, created_at")
    .eq("user_id", user.id)
    .order("created_at")
  const questions: VisitQuestion[] = (data ?? []).map((row) => ({ id: row.id, body: row.body, asked: Boolean(row.asked_at) }))

  return (
    <Screen>
      <Blob style={{ right: -120, top: 60, width: 360, height: 420 }} />
      <TopBar title="Sor" />
      <main className="nb-main">
        <QuestionBank sources={Object.fromEntries(Object.entries(SOURCES).map(([key, source]) => [key, source.citation]))} />
        <div className="nb-head" style={{ marginTop: 26 }}>
          <h3>Vizitede soracaklarım</h3>
        </div>
        <VisitQuestions initial={questions} />
      </main>
      <Tabs current="sor" />
    </Screen>
  )
}
