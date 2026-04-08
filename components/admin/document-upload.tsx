"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface DocumentUploadProps {
  patientId: string
  appointmentId?: string
  onDocumentUploaded?: () => void
}

const DOCUMENT_CATEGORIES = [
  { value: "hormon_tahlilleri", label: "Hormon Tahlilleri" },
  { value: "rahim_filmi", label: "Rahim Filmi (HSG)" },
  { value: "spermiogram", label: "Spermiogram" },
  { value: "genetik_testler", label: "Genetik Testler" },
  { value: "ameliyat_raporlari", label: "Ameliyat Raporları" },
  { value: "diger", label: "Diğer" },
]

export function DocumentUpload({ patientId, appointmentId, onDocumentUploaded }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] = useState<string>("diger")

  // Use singleton client
  const supabase = createClient()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Dosya boyutu çok büyük. Maksimum 10MB olmalıdır.")
      return
    }

    if (!category) {
      toast.error("Lütfen evrak kategorisi seçin.")
      return
    }

    setUploading(true)

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${patientId}/${category}_${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("patient-documents")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from("patient-documents").getPublicUrl(fileName)

      const { error: dbError } = await supabase.from("patient_documents").insert({
        patient_id: patientId,
        appointment_id: appointmentId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type || "application/octet-stream",
        file_size: file.size,
        category: category,
        status: "beklemede",
        uploaded_at: new Date().toISOString(),
      })

      if (dbError) throw dbError

      toast.success("Evrak başarıyla yüklendi!")
      onDocumentUploaded?.()

      // Reset
      setCategory("diger")
      const input = document.getElementById("document-upload") as HTMLInputElement
      if (input) input.value = ""
    } catch (error: any) {
      console.error("[v0] Evrak yükleme hatası:", error.message || error)
      toast.error("Evrak yüklenirken bir hata oluştu.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4">Yeni Evrak Yükle</h3>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Evrak Kategorisi</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Button
            variant="outline"
            className="w-full bg-transparent"
            disabled={uploading}
            onClick={() => document.getElementById("document-upload")?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Yükleniyor...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Dosya Seç
              </>
            )}
          </Button>

          <input
            id="document-upload"
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />

          <p className="text-xs text-muted-foreground mt-2">PDF, JPG veya PNG formatında, maksimum 10MB</p>
        </div>
      </div>
    </Card>
  )
}

export default DocumentUpload
