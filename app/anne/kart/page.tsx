import Link from "next/link"
import { requireReadyUser } from "@/lib/anne/server"
import { sizeComparison } from "@/lib/anne/content/sizes"
import { babyImage } from "@/lib/anne/images"
import { Screen, Slot, TopBar } from "@/components/anne/chrome"
import { ShareCard } from "@/components/anne/share-card"

export const dynamic = "force-dynamic"

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase("tr-TR") + text.slice(1)
}

// Hafta kartı: aileyle paylaşılacak görsel. Kartta ad ve sağlık bilgisi yer almaz.
export default async function AnneKartPage() {
  const { age } = await requireReadyUser()

  const size = sizeComparison(age.weeks)
  const countdown = age.daysToDue > 0 ? `kavuşmaya ${age.daysToDue} gün` : "kavuşma çok yakın"
  const line = size ? `${capitalize(size)} kadar · ${countdown}` : capitalize(countdown)
  const image = babyImage(age.weeks)

  return (
    <Screen>
      <TopBar>
        <Link className="nb-skip" href="/anne/bebegim">
          Kapat
        </Link>
      </TopBar>
      <main className="nb-main">
        <ShareCard week={age.weeks} line={line} babySrc={image.src} baby={<Slot image={image} width={240} height={240} round />} />
      </main>
    </Screen>
  )
}
