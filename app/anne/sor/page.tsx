import { appDb, requireReadyUser } from "@/lib/anne/server"
import { Blob, Screen, Tabs, TopBar } from "@/components/anne/chrome"
import { VisitQuestions, type VisitQuestion } from "@/components/anne/visit-questions"

export const dynamic = "force-dynamic"

// Sor: vizitede sorulacaklar listesi. Uygulama kendi başına tıbbi yanıt üretmez.
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
        <VisitQuestions initial={questions} />
      </main>
      <Tabs current="sor" />
    </Screen>
  )
}
