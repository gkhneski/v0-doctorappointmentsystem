"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2, X } from "lucide-react"

type PatientResult = {
  id: string
  full_name: string
  phone: string | null
  tc_no: string | null
  date_of_birth: string | null
}

export function PatientQuickSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<PatientResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  // Dışarı tıklayınca kapat
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Debounced arama
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/patients/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setResults(data.patients || [])
        setOpen(true)
        setActiveIndex(-1)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const goToPatient = (id: string) => {
    setOpen(false)
    setQuery("")
    setResults([])
    router.push(`/admin/patients/${id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (!open || results.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % results.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const target = activeIndex >= 0 ? results[activeIndex] : results[0]
      if (target) goToPatient(target.id)
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2 h-7 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
        <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Hasta ara (isim, TC, telefon)"
          className="w-44 bg-transparent text-xs outline-none placeholder:text-gray-400 sm:w-56"
          aria-label="Hasta ara"
        />
        {loading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-gray-400" />}
        {!loading && query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setResults([]); setOpen(false) }}
            className="shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="Temizle"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-9 z-[60] w-80 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          {results.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-gray-500">
              {query.trim().length < 2 ? "En az 2 karakter yazın" : "Hasta bulunamadı"}
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((p, idx) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => goToPatient(p.id)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors ${
                      idx === activeIndex ? "bg-primary/10" : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-900">{p.full_name}</span>
                    <span className="flex flex-wrap gap-x-3 text-[11px] text-gray-500">
                      {p.phone && p.phone !== "0000000000" && <span>{p.phone}</span>}
                      {p.tc_no && <span>TC: {p.tc_no}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
