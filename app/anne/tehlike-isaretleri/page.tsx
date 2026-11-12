import Link from "next/link"
import { DANGER_ACTION, DANGER_SIGNS, DANGER_SOURCES } from "@/lib/anne/content/danger-signs"
import { SOURCES } from "@/lib/anne/content/sources"
import { Screen, TopBar } from "@/components/anne/chrome"

// Girişsiz de açılır: acil bilgi kimseden saklanmaz.
export default function AnneTehlikeIsaretleriPage() {
  return (
    <Screen>
      <TopBar>
        <Link className="nb-skip" href="/anne">
          Kapat
        </Link>
      </TopBar>
      <main className="nb-main">
        <h1 style={{ marginTop: 18, fontSize: 30 }}>
          Ne zaman <b>doktora</b> gitmeliyim?
        </h1>
        <div className="nb-card" data-tone="dark" style={{ padding: "14px 18px" }}>
          <p style={{ fontSize: 15 }}>{DANGER_ACTION}</p>
        </div>
        <div className="nb-card" style={{ padding: "10px 18px" }}>
          <ol className="nb-list">
            {DANGER_SIGNS.map((sign) => (
              <li key={sign}>{sign}</li>
            ))}
          </ol>
        </div>
        <div className="nb-grow" />
        <a className="nb-btn" href="tel:112">
          112&apos;yi ara
        </a>
        <p className="nb-note" style={{ marginTop: 8, textAlign: "center", fontSize: 12 }}>
          Kaynak: {DANGER_SOURCES.map((key) => SOURCES[key].citation).join("; ")}.
        </p>
      </main>
    </Screen>
  )
}
