import Link from "next/link"
import { appDb, requireReadyUser } from "@/lib/anne/server"
import { Screen, TopBar } from "@/components/anne/chrome"
import { Album, type AlbumPhoto } from "@/components/anne/album"

export const dynamic = "force-dynamic"

export default async function AnneAlbumPage() {
  const { user, age } = await requireReadyUser()

  const { data } = await appDb().from("app_photos").select("id, kind, week").eq("user_id", user.id).order("week")
  const photos: AlbumPhoto[] = (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind === "ultrason" ? "ultrason" : "karin",
    week: row.week,
  }))

  return (
    <Screen>
      <TopBar title="Albüm">
        <Link className="nb-skip" href="/anne/ana">
          Kapat
        </Link>
      </TopBar>
      <main className="nb-main">
        <Album week={Math.min(age.weeks, 44)} initial={photos} />
      </main>
    </Screen>
  )
}
