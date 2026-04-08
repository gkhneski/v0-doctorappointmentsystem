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
        <DialogHeader>
          <DialogTitle>
            {verificationStep === "form" ? "Hasta Bilgilerini Girin" : "KVKK Onay Kodu"}
          </DialogTitle>
          <DialogDescription>
            {selectedAppointment?.patients?.full_name}
          </DialogDescription>
        </DialogHeader>

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
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              <p className="font-medium">KVKK Dogrulama</p>
              <p className="text-xs mt-1">Telefona 6 haneli onay kodu gonderilecek. Hastayi onayla kutusuna gireceginiz kodu soyleyiniz.</p>
            </div>
          </div>
        )}

        {selectedAppointment && verificationStep === "code" && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <p className="text-sm text-green-800 mb-2">Kod gonderildi:</p>
              <p className="font-bold text-green-700">{completeFormData.phone}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="verification-code">6 Haneli Onay Kodu</Label>
              <Input
                id="verification-code"
                placeholder="______"
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                value={verificationCode}
                onChange={(e) => onVerificationCodeChange(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Hastanin telefonuna gelen 6 haneli kodu girin
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          {verificationStep === "form" ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Iptal</Button>
              <Button
                onClick={onSendVerificationCode}
                disabled={completingInfo || !completeFormData.tc_no || !completeFormData.phone}
                className="bg-green-600 hover:bg-green-700"
              >
                {completingInfo ? <Spinner className="h-4 w-4" /> : "Kod Gonder"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onVerificationStepChange("form")}>Geri</Button>
              <Button
                onClick={onVerifyCode}
                disabled={verifyingCode || verificationCode.length !== 6}
                className="bg-green-600 hover:bg-green-700"
              >
                {verifyingCode ? <Spinner className="h-4 w-4" /> : "Onayla"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
