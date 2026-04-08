"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { FileText, CheckCircle2 } from "lucide-react"

interface AppointmentLinkFormProps {
  appointmentId: string
  token: string
  appointmentType: string
}

export default function AppointmentLinkForm({ appointmentId, token, appointmentType }: AppointmentLinkFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    pregnancyHistory: "",
    ivfAttempts: "",
    miscarriageHistory: "",
    chronicDiseases: "",
    medicalNotes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/appointment-link/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          appointmentId,
          formData,
        }),
      })

      if (response.ok) {
        setIsSuccess(true)
      } else {
        alert("Form gönderilemedi. Lütfen tekrar deneyin.")
      }
    } catch (error) {
      console.error("[v0] Form submission error:", error)
      alert("Bir hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bilgileriniz Kaydedildi</h2>
        <p className="text-gray-600">Teşekkür ederiz. Randevunuzda görüşmek üzere.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-yellow-700 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-2">Yanınızda Getirmeniz Gereken Evraklar</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              {appointmentType === "gebelik-takibi" ||
              appointmentType === "gebelik-istemi-infertilite" ||
              appointmentType === "ayrintili-fetal-ultrason" ? (
                <>
                  <li>• Gebelikte yaptırdığınız kan idrar tahlilleri</li>
                  <li>• Gebelikte yaptırdığınız ultrasonlar</li>
                  <li>• İkili / üçlü / dörtlü testler</li>
                  <li>• Fetal DNA analizleri</li>
                  <li>• Aldığınız ilaçların isimleri veya fotoğrafları</li>
                  <li>• Kan grubunuzun bilgisi</li>
                </>
              ) : appointmentType === "jinekolojik-muayene" ? (
                <>
                  <li>• Smear Testi Sonuçları (Son 1 yıl içinde)</li>
                  <li>• HPV Test Sonuçları (Varsa)</li>
                  <li>• Ultrason Görüntüleri (Jinekolojik)</li>
                  <li>• Kan Tahlilleri (Hormon testleri)</li>
                  <li>• Geçmiş Ameliyat Raporları</li>
                  <li>• Kullandığınız İlaçlar</li>
                </>
              ) : appointmentType === "kontrol-takip" ? (
                <>
                  <li>• Yaptırdığınız kan idrar tahlilleri</li>
                  <li>• Yaptırdığınız ultrasonlar</li>
                  <li>• MRG ve Tomografi sonuçları</li>
                  <li>• Smear / HPV Test sonuçları</li>
                  <li>• Ameliyat veya biyopsi notları</li>
                  <li>• Diğer hastalık bilgileri</li>
                </>
              ) : (
                <>
                  <li>• Hormon Tahlilleri (FSH, LH, E2, AMH, Prolaktin)</li>
                  <li>• Rahim Filmi (HSG)</li>
                  <li>• Spermiogram</li>
                  <li>• Genetik Tahliller</li>
                  <li>• Önceki Tedavilerin Ayrıntıları</li>
                  <li>• Geçirdiğiniz Ameliyatların Notları</li>
                </>
              )}
            </ul>
            <p className="text-xs text-yellow-700 mt-2">
              Bu evraklar bilgilendirme amaçlıdır. Varsa yanınızda getirmeniz önerilir.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Tıbbi Geçmiş Formu</h3>

        <div>
          <Label htmlFor="pregnancyHistory">Gebelik Geçmişi</Label>
          <Textarea
            id="pregnancyHistory"
            value={formData.pregnancyHistory}
            onChange={(e) => setFormData({ ...formData, pregnancyHistory: e.target.value })}
            placeholder="Daha önce hamile kaldınız mı? Kaç doğum yaptınız?"
            className="mt-2"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="ivfAttempts">Tüp Bebek Denemeleri</Label>
          <Textarea
            id="ivfAttempts"
            value={formData.ivfAttempts}
            onChange={(e) => setFormData({ ...formData, ivfAttempts: e.target.value })}
            placeholder="Daha önce tüp bebek tedavisi gördünüz mü? Kaç deneme?"
            className="mt-2"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="miscarriageHistory">Düşük Geçmişi</Label>
          <Textarea
            id="miscarriageHistory"
            value={formData.miscarriageHistory}
            onChange={(e) => setFormData({ ...formData, miscarriageHistory: e.target.value })}
            placeholder="Daha önce düşük yaşadınız mı? Kaç kez?"
            className="mt-2"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="chronicDiseases">Kronik Hastalıklar</Label>
          <Textarea
            id="chronicDiseases"
            value={formData.chronicDiseases}
            onChange={(e) => setFormData({ ...formData, chronicDiseases: e.target.value })}
            placeholder="Sürekli kullandığınız ilaçlar veya kronik hastalıklarınız var mı?"
            className="mt-2"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="medicalNotes">Ek Notlar</Label>
          <Textarea
            id="medicalNotes"
            value={formData.medicalNotes}
            onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
            placeholder="Doktorunuzun bilmesini istediğiniz başka bir şey var mı?"
            className="mt-2"
            rows={4}
          />
        </div>
      </div>

      <Button type="submit" className="w-full h-12 text-lg" disabled={isSubmitting}>
        {isSubmitting ? "Gönderiliyor..." : "Formu Gönder"}
      </Button>
    </form>
  )
}
