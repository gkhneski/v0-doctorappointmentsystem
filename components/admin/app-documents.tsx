"use client"

import { useEffect, useState } from "react"
import { FileText, ImageIcon, Smartphone } from "lucide-react"
import { documentCategoryLabel } from "@/lib/anne/document-types"
import type { StaffDocument } from "@/lib/app-documents"

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(iso))
}

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/**
 * Hastanın uygulamadan yüklediği belgeler (tahlil, rapor, reçete). Hasta kartında klinik
 * hasta kimliğiyle, Hasta Uygulaması ekranında hesap kimliğiyle kullanılır. Belge yeni
 * sekmede açılır; ilk açılışta hastanın ekranında "klinik gördü" olarak işaretlenir.
 */
export function AppDocuments({ patientId, accountId, hideWhenEmpty = false }: { patientId?: string; accountId?: string; hideWhenEmpty?: boolean }) {
  const [documents, setDocuments] = useState<StaffDocument[] | null>(null)
  const [failed, setFailed] = useState(false)
  const query = patientId ? `hasta=${patientId}` : `hesap=${accountId}`

  useEffect(() => {
    let cancelled = false
    setDocuments(null)
    setFailed(false)
    fetch(`/api/admin/uygulama/belgeler?${query}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (cancelled) return
        if (!response.ok || !Array.isArray(data.documents)) setFailed(true)
        else setDocuments(data.documents)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [query])

  if (hideWhenEmpty && !failed && (documents === null || documents.length === 0)) return null

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-violet-900">
        <Smartphone className="h-4 w-4" />
        Hastanın uygulamadan yükledikleri
        {documents && documents.length > 0 && (
          <span className="rounded-full bg-violet-200 px-2 py-0.5 text-xs tabular-nums">{documents.length}</span>
        )}
      </div>

      {failed ? (
        <p className="text-sm text-red-700">Belgeler yüklenemedi. Sayfayı yenileyip yeniden deneyin.</p>
      ) : documents === null ? (
        <p className="text-sm text-gray-500">Yükleniyor…</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-gray-500">Hasta uygulamadan belge yüklememiş.</p>
      ) : (
        <ul className="divide-y divide-violet-100 rounded-md border border-violet-100 bg-white">
          {documents.map((doc) => {
            const Icon = doc.mime === "application/pdf" ? FileText : ImageIcon
            const unseen = !doc.seenAt
            return (
              <li key={doc.id}>
                <a
                  className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-violet-50"
                  href={`/api/admin/uygulama/belgeler?dosya=${doc.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    setDocuments((prev) => prev?.map((d) => (d.id === doc.id && !d.seenAt ? { ...d, seenAt: new Date().toISOString() } : d)) ?? prev)
                  }
                >
                  <Icon className="h-4 w-4 flex-none text-violet-700" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-gray-900">
                      {documentCategoryLabel(doc.category)}
                      {doc.title ? ` · ${doc.title}` : ""}
                    </span>
                    <span className="block text-xs tabular-nums text-gray-500">
                      {formatWhen(doc.createdAt)} · {formatSize(doc.sizeBytes)}
                    </span>
                  </span>
                  {unseen && <span className="flex-none rounded-full bg-violet-600 px-2 py-0.5 text-xs font-medium text-white">Yeni</span>}
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
