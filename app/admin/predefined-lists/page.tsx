import { Metadata } from "next"
import { PredefinedListsManager } from "@/components/admin/predefined-lists-manager"

export const metadata: Metadata = {
  title: "İlaç/Vitamin Listeleri - Yönetim Paneli",
  description: "Hazır ilaç, vitamin ve tahlil listelerini yönetin",
}

export default function PredefinedListsPage() {
  return <PredefinedListsManager />
}
