import Link from "next/link"
import { requireReadyUser } from "@/lib/anne/server"
import { mythsOfDay } from "@/lib/anne/content/myths"
import { Icon, Screen, Tabs, TopBar, type ICONS } from "@/components/anne/chrome"

export const dynamic = "force-dynamic"

const GAMES: { href: string; icon: keyof typeof ICONS; title: string; note: string; tone?: "dark" | "accent" }[] = [
  { href: "/anne/ses", icon: "mic", title: "Beni böyle duyuyor", note: "Sesini karnından dinle", tone: "accent" },
  { href: "/anne/tat", icon: "taste", title: "Havuç mu, lahana mı?", note: "Yediğine tepkisini gör", tone: "dark" },
  { href: "/anne/tekme", icon: "kick", title: "Tekme", note: "Dokun, say, kaydet" },
  { href: "/anne/isimler", icon: "letters", title: "İsim çarkı", note: "Çevir, durdur, anlamına bak" },
]

// Oyun: günün efsane kartları ve diğer oyunlar.
export default async function AnneOyunPage() {
  const { today } = await requireReadyUser()
  const first = mythsOfDay(today)[0]

  return (
    <Screen>
      <TopBar title="Oyun" />
      <main className="nb-main">
        <Link className="nb-card" data-tone="dark" href="/anne/efsane" style={{ marginTop: 18, padding: 22 }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.04em", opacity: 0.8 }}>DOĞRU MU, EFSANE Mİ?</p>
          <h2 style={{ marginTop: 10 }}>{first.text}</h2>
          <span className="nb-chip" style={{ marginTop: 16 }}>
            Bugünün 5 kartını aç
          </span>
        </Link>

        {GAMES.map((game) => (
          <Link key={game.href} className="nb-card nb-row-card" href={game.href} style={{ padding: 14 }}>
            <span className="nb-thumb" data-tone={game.tone}>
              <Icon name={game.icon} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <b style={{ display: "block", fontSize: 17, fontWeight: 800 }}>{game.title}</b>
              <span className="nb-note">{game.note}</span>
            </span>
            <Icon name="next" />
          </Link>
        ))}
        <div className="nb-grow" />
      </main>
      <Tabs current="oyun" />
    </Screen>
  )
}
