import Link from "next/link"
import { appDb, requireReadyUser } from "@/lib/anne/server"
import { isKnownName } from "@/lib/anne/content/names"
import { Screen, TopBar } from "@/components/anne/chrome"
import { NameFinder } from "@/components/anne/name-finder"

export const dynamic = "force-dynamic"

export default async function AnneIsimlerPage() {
  const { user } = await requireReadyUser()

  const { data } = await appDb().from("app_name_likes").select("name, created_at").eq("user_id", user.id).order("created_at")
  const liked = (data ?? []).map((row) => row.name).filter(isKnownName)

  return (
    <Screen>
      <TopBar>
        <Link className="nb-skip" href="/anne/ana">
          Kapat
        </Link>
      </TopBar>
      <main className="nb-main" style={{ alignItems: "center", textAlign: "center" }}>
        <h1 style={{ marginTop: 20 }}>
          <b>İsim</b> bulucu
        </h1>
        <p className="nb-note" style={{ marginTop: 6, fontSize: 15 }}>
          Beğen ya da geç. Beğendiklerin hesabında durur.
        </p>
        <NameFinder initialLiked={liked} />
      </main>
    </Screen>
  )
}
