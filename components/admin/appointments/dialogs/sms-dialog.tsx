import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type SmsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  phone: string
  patientName?: string
  message: string
  onMessageChange: (message: string) => void
  onSend: () => void
  isSending?: boolean
  appointmentDate?: string
  appointmentTime?: string
}

export function SmsDialog({
  open,
  onOpenChange,
  phone,
  patientName,
  message,
  onMessageChange,
  onSend,
  isSending = false,
  appointmentDate,
  appointmentTime,
}: SmsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>SMS Gönder</DialogTitle>
          <DialogDescription>
            {patientName} - {phone}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Mesaj</label>
            <textarea
              className="w-full min-h-[100px] p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="SMS mesajınızı yazın..."
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMessageChange(`Sayın ${patientName}, randevunuz ${appointmentDate} tarihinde saat ${appointmentTime}'de. Prof. Dr. Eray Çalışkan`)}
            >
              Hatırlatma
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMessageChange(`Sayın ${patientName}, randevunuz onaylanmıştır. Prof. Dr. Eray Çalışkan`)}
            >
              Onay
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
          <Button onClick={onSend} disabled={isSending || !message}>
            {isSending ? "Gönderiliyor..." : "Gönder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
