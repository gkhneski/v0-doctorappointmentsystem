import Link from "next/link"
import { appDb, requireReadyUser } from "@/lib/anne/server"
import { listGenerations } from "@/lib/anne/generation/service"
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

  // Üretilen bebek yüzü resimleri de albümün başında görünür.
  const faces = (await listGenerations(appDb(), user.id)).filter((item) => item.status === "generated")

  return (
    <Screen>
      <TopBar title="Albüm">
        <Link className="nb-skip" href="/anne/ana">
          Kapat
        </Link>
      </TopBar>
      <main className="nb-main">
        {faces.length > 0 && (
          <section>
            <h3 style={{ marginTop: 8 }}>Bebeğimin yüzü</h3>
            <div className="nb-grid" data-cols="2">
              {faces.map((face) => (
                <Link className="nb-photo" key={face.id} href="/anne/yuz" aria-label="Bebeğimin yüzü ekranını aç">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/anne/uretim?resim=${face.id}`} alt="Bebek yüzü canlandırması" loading="lazy" />
                  {face.week !== null && <span>{face.week}. hafta</span>}
                </Link>
              ))}
            </div>
          </section>
        )}
        <Album week={Math.min(age.weeks, 44)} initial={photos} />
      </main>
    </Screen>
  )
}
