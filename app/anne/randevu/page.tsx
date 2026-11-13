import Link from "next/link"
import { appDb, requireReadyUser } from "@/lib/anne/server"
import { bookingState } from "@/lib/anne/clinic-booking"
import { Screen, TopBar } from "@/components/anne/chrome"
import { Booking } from "@/components/anne/booking"

export const dynamic = "force-dynamic"

// Randevu: kliniğin takviminden canlı boş saatler ve hastanın yaklaşan randevuları.
export default async function AnneRandevuPage() {
  const { user, today } = await requireReadyUser()
  const state = await bookingState(appDb(), user)

  return (
    <Screen>
      <TopBar title="Randevu">
        <Link className="nb-skip" href="/anne/ana">
          Kapat
        </Link>
      </TopBar>
      <main className="nb-main">
        <Booking initial={state} today={today} defaultName="" />
      </main>
    </Screen>
  )
}
