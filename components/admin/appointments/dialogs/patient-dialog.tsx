import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

type PatientDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedAppointment: any
  verificationStep: "form" | "code"
  onVerificationStepChange: (step: "form" | "code") => void
  completeFormData: any
  onFormDataChange: (data: any) => void
  verificationCode: string
  onVerificationCodeChange: (code: string) => void
  completingInfo: boolean
  verifyingCode: boolean
  onSendVerificationCode: () => void
  onVerifyCode: () => void
}

export function PatientDialog({
  open,
  onOpenChange,
  selectedAppointment,
  verificationStep,
  onVerificationStepChange,
  completeFormData,
  onFormDataChange,
  verificationCode,
  onVerificationCodeChange,
  completingInfo,
  verifyingCode,
  onSendVerificationCode,
  onVerifyCode,
}: PatientDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        onOpenChange(newOpen)
        if (newOpen && selectedAppointment) {
          onFormDataChange({
            tc_no: selectedAppointment.patients?.tc_no?.startsWith("TEMP_") ? "" : (selectedAppointment.patients?.tc_no || ""),
            phone: selectedAppointment.patients?.phone === "0000000000" ? "" : (selectedAppointment.patients?.phone || ""),
            date_of_birth: "",
          })
          onVerificationStepChange("form")
          onVerificationCodeChange("")
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        {(() => {
          const p = selectedAppointment?.patients
          const isTemp = p?.tc_no?.startsWith("TEMP_")
          const hasPhone = p?.phone && p.phone !== "0000000000"
          const infoMissing = isTemp || !p?.tc_no || !hasPhone
          return (
            <DialogHeader>
              <DialogTitle>
                {verificationStep === "code"
                  ? "KVKK Onay Kodu"
                  : infoMissing
                  ? "Hasta Bilgilerini Tamamlayın"
                  : "Hasta Bilgileri / KVKK Doğrulama"}
              </DialogTitle>
              <DialogDescription>
                {p?.full_name}
                {verificationStep === "form" && (
                  isTemp ? (
                    <span className="block mt-1 text-orange-600 font-medium">
                      Geçici Kayıt - Bilgiler tamamlanmalı
                    </span>
                  ) : !infoMissing ? (
                    <span className="block mt-1 text-green-700 font-medium">
                      Bilgiler kayıtlı - dilerseniz KVKK onay kodu gönderebilirsiniz
                    </span>
                  ) : null
                )}
              </DialogDescription>
            </DialogHeader>
          )
        })()}

        {selectedAppointment && verificationStep === "form" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="patient-tc">
                TC Kimlik No <span className="text-destructive">*</span>
              </Label>
              <Input
                id="patient-tc"
                placeholder="11 haneli TC Kimlik No"
                maxLength={11}
                value={completeFormData.tc_no}
                onChange={(e) => onFormDataChange({ ...completeFormData, tc_no: e.target.value.replace(/\D/g, "") })}
              />
              {selectedAppointment.patients?.tc_no?.startsWith("TEMP_") && (
                <p className="text-xs text-amber-600">Gecici TC - Gercek TC girilmeli</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-phone">
                Telefon <span className="text-destructive">*</span>
              </Label>
              <Input
                id="patient-phone"
                placeholder="05XX XXX XX XX"
                value={completeFormData.phone}
                onChange={(e) => onFormDataChange({ ...completeFormData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-birth">Dogum Tarihi</Label>
              <Input
                id="patient-birth"
                type="date"
                value={completeFormData.date_of_birth}
                onChange={(e) => onFormDataChange({ ...completeFormData, date_of_birth: e.target.value })}
              />
            </div>
            <div className="rounded-lg bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 p-4 text-sm">
              <p className="font-bold text-blue-900 mb-2">📋 KVKK Doğrulama Süreci</p>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li>Telefona <strong>6 haneli onay kodu</strong> gönderilecek</li>
                <li>Hastaya kodu söylemesini isteyin</li>
                <li>Kod ile hasta <strong>KVKK onaylı</strong> olacak</li>
                <li>Artık randevularını alabilir</li>
              </ul>
            </div>
          </div>
        )}

        {selectedAppointment && verificationStep === "code" && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 text-center">
              <div className="mb-3">
                <span className="text-3xl">📱</span>
              </div>
              <p className="text-sm text-green-800 mb-2 font-medium">SMS Gönderildi</p>
              <p className="font-bold text-lg text-green-700">{completeFormData.phone}</p>
              <p className="text-xs text-green-600 mt-2">Hastaya telefonuna gelen kodu söylemesini isteyin</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="verification-code" className="text-base font-semibold">
                6 Haneli KVKK Onay Kodu
              </Label>
              <Input
                id="verification-code"
                placeholder="_ _ _ _ _ _"
                maxLength={6}
                className="text-center text-3xl tracking-widest font-mono h-14 border-2 focus:border-green-500"
                value={verificationCode}
                onChange={(e) => onVerificationCodeChange(e.target.value.replace(/\D/g, ""))}
                autoFocus
              />
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800">
                <strong>⏱️ Not:</strong> Kod 5 dakika geçerlidir. Hasta kodu söyleyince yukarıya girin ve onaylayın.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {verificationStep === "form" ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
              <Button
                onClick={onSendVerificationCode}
                disabled={completingInfo || !completeFormData.tc_no || !completeFormData.phone}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                {completingInfo ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    📤 KVKK Kodu Gönder
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onVerificationStepChange("form")}>← Geri</Button>
              <Button
                onClick={onVerifyCode}
                disabled={verifyingCode || verificationCode.length !== 6}
                className="bg-green-600 hover:bg-green-700 gap-2 font-semibold"
              >
                {verifyingCode ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Onaylanıyor...
                  </>
                ) : (
                  <>
                    ✓ KVKK Onaylayın
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
