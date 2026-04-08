"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Camera, X, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface PatientPhotoUploadProps {
  patientId: string
  patientName: string
  currentPhotoUrl?: string | null
  onPhotoUploaded?: (url: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function PatientPhotoUpload({
  patientId,
  patientName,
  currentPhotoUrl,
  onPhotoUploaded,
  open = false,
  onOpenChange,
}: PatientPhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Use singleton client
  const supabase = createClient()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Dosya boyut kontrolü (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya boyutu çok büyük. Maksimum 5MB olmalıdır.")
      return
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith("image/")) {
      toast.error("Sadece resim dosyaları yüklenebilir.")
      return
    }

    setUploading(true)

    try {
      // Önizleme için local URL oluştur
      const localUrl = URL.createObjectURL(file)
      setPreviewUrl(localUrl)

      // Dosya adını oluştur (patient_id + timestamp)
      const fileExt = file.name.split(".").pop()
      const fileName = `profile_${patientId}_${Date.now()}.${fileExt}`
      const filePath = `profile-photos/${fileName}`

      const { data: existingData } = await supabase
        .from("patients")
        .select("profile_photo_url")
        .eq("id", patientId)
        .single()

      // Upload et
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("patient-documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        })

      if (uploadError) {
        throw new Error(`Upload hatası: ${uploadError.message}`)
      }

      // Public URL al
      const { data: urlData } = supabase.storage.from("patient-documents").getPublicUrl(filePath)

      const photoUrlToSave = urlData.publicUrl

      // Database'i güncelle
      const { error: updateError } = await supabase
        .from("patients")
        .update({ profile_photo_url: photoUrlToSave })
        .eq("id", patientId)

      if (updateError) {
        throw new Error(`Database hatası: ${updateError.message}`)
      }

      setPhotoUrl(photoUrlToSave)
      toast.success("Fotoğraf başarıyla yüklendi!")

      onPhotoUploaded?.(photoUrlToSave)
      onOpenChange?.(false)
    } catch (error: any) {
      console.error("[v0] Fotoğraf yükleme hatası:", error)
      toast.error(error.message || "Fotoğraf yüklenirken bir hata oluştu")
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (!photoUrl && !currentPhotoUrl) return

    setUploading(true)

    try {
      // Database'den URL'yi temizle
      const { error: updateError } = await supabase
        .from("patients")
        .update({ profile_photo_url: null })
        .eq("id", patientId)

      if (updateError) throw updateError

      setPhotoUrl(null)
      setPreviewUrl(null)
      toast.success("Fotoğraf kaldırıldı.")

      onPhotoUploaded?.("")
      onOpenChange?.(false)
    } catch (error: any) {
      console.error("[v0] Fotoğraf kaldırma hatası:", error)
      toast.error("Fotoğraf kaldırılırken bir hata oluştu.")
    } finally {
      setUploading(false)
    }
  }

  const displayUrl = previewUrl || photoUrl || currentPhotoUrl
  const initials =
    patientName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profil Fotoğrafı</DialogTitle>
          <DialogDescription>JPG, PNG veya WebP formatında, maksimum 5MB</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <Avatar className="h-32 w-32">
            {displayUrl ? (
              <AvatarImage src={displayUrl || "/placeholder.svg"} alt={patientName} />
            ) : (
              <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
            )}
          </Avatar>

          <div className="flex gap-2 w-full justify-center">
            <Button
              variant="outline"
              disabled={uploading}
              onClick={() => document.getElementById("photo-upload-input")?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  {displayUrl ? "Fotoğrafı Değiştir" : "Fotoğraf Yükle"}
                </>
              )}
            </Button>

            {displayUrl && (
              <Button variant="outline" size="icon" disabled={uploading} onClick={handleRemovePhoto}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <input
            id="photo-upload-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
