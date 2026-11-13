import Link from "next/link"
import { appDb, requireReadyUser } from "@/lib/anne/server"
import { DOCUMENT_COLUMNS, MAX_DOCUMENTS, toAppDocument } from "@/lib/anne/document-types"
import { Screen, TopBar } from "@/components/anne/chrome"
import { Documents } from "@/components/anne/documents"

export const dynamic = "force-dynamic"

// Belgeler: hasta tahlil, rapor ve reçetelerini yükler; klinik hasta kartında görür.
export default async function AnneBelgelerPage() {
  const { user } = await requireReadyUser()

  const { data } = await appDb()
    .from("app_documents")
    .select(DOCUMENT_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(MAX_DOCUMENTS)

  return (
    <Screen>
      <TopBar title="Belgelerim">
        <Link className="nb-skip" href="/anne/ana">
          Kapat
        </Link>
      </TopBar>
      <main className="nb-main">
        <Documents initial={(data ?? []).map(toAppDocument)} />
      </main>
    </Screen>
  )
}
