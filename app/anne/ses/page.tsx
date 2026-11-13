import Link from "next/link"
import { appDb, requireReadyUser } from "@/lib/anne/server"
import { latestFace } from "@/lib/anne/animation/service"
import { SOURCES } from "@/lib/anne/content/sources"
import { Icon, Screen } from "@/components/anne/chrome"
import { WombVoice } from "@/components/anne/womb-voice"

export const dynamic = "force-dynamic"

// Beni böyle duyuyor: annenin sesi karnında duyulduğu gibi çalınır.
export default async function AnneSesPage() {
  const { user } = await requireReadyUser()
  const face = await latestFace(appDb(), user.id).catch(() => null)

  return (
    <Screen>
      <div className="nb-reel">
        <header className="nb-reel-top">
          <Link className="nb-glass" href="/anne/oyun" aria-label="Geri">
            <Icon name="back" />
          </Link>
          <h2>Beni böyle duyuyor</h2>
        </header>
        <WombVoice
          faceUrl={face ? `/api/anne/canli?yuz=${face.id}` : null}
          science="Annenin dokuları ve bebeği saran sıvı tiz sesleri süzer; bebeğe sesin en çok kalın kısmı, ezgisi ve ritmi ulaşır. Yenidoğanlar annelerinin bu şekilde süzülmüş sesini tercih eder."
          source={SOURCES.rahimdeSes.citation}
        />
      </div>
    </Screen>
  )
}
