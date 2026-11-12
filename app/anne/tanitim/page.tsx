import Link from "next/link"
import { IMAGES } from "@/lib/anne/images"
import { Blob, Screen, Slot, TopBar } from "@/components/anne/chrome"

export default function AnneTanitimPage() {
  return (
    <Screen>
      <Blob tone="lilac" style={{ left: 180, top: 60, width: 300, height: 360 }} />
      <TopBar>
        <Link className="nb-skip" href="/anne/giris">
          Geç
        </Link>
      </TopBar>
      <main className="nb-main">
        <div style={{ position: "relative", height: 430, marginTop: 26 }}>
          <p className="nb-letters" aria-hidden="true" style={{ position: "absolute", left: 0, top: 0 }}>
            NEO
          </p>
          <p className="nb-letters" aria-hidden="true" style={{ position: "absolute", right: 0, bottom: 0, fontSize: 100 }}>
            BREED
          </p>
          <Blob tone="coral" style={{ left: 64, top: 96, width: 230, height: 230 }} />
          <Slot image={IMAGES.introMother} width={190} height={247} style={{ position: "absolute", left: 84, top: 40, zIndex: 1 }} />
        </div>
        <div className="nb-grow" />
        <h1 style={{ textAlign: "center" }}>
          <b>Hafta hafta</b>
          <br />
          bebeğin
        </h1>
        <p className="nb-note" style={{ marginTop: 12, textAlign: "center", fontSize: 15 }}>
          Boyu, ağırlığı ve o hafta neler olduğu.
        </p>
        <Link className="nb-btn" href="/anne/giris" style={{ marginTop: 20 }}>
          Devam
        </Link>
      </main>
    </Screen>
  )
}
