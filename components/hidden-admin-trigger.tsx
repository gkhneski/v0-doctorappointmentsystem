"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"

export default function HiddenAdminTrigger({ children }: { children: React.ReactNode }) {
  const clickCount = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  const handleClick = () => {
    clickCount.current += 1

    // Reset sayacı 2 saniye sonra sıfırla
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      clickCount.current = 0
    }, 2000)

    // 5 kez tıklayınca gizli admin girişine yönlendir
    if (clickCount.current >= 5) {
      clickCount.current = 0
      if (timerRef.current) clearTimeout(timerRef.current)
      router.push("/auth/admin/login?ref=ec25")
    }
  }

  return (
    <span onClick={handleClick} className="cursor-default select-none">
      {children}
    </span>
  )
}
