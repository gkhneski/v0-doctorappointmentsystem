import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"

type DeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  deleteId: string | null
  onConfirm: () => void
  isDeleting?: boolean
}

export function DeleteDialog({ open, onOpenChange, deleteId, onConfirm, isDeleting = false }: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Randevuyu Sil?</AlertDialogTitle>
          <AlertDialogDescription>
            Bu randevu kalıcı olarak silinecek. Bu işlem geri alınamaz.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? <Spinner className="h-4 w-4" /> : "Sil"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
