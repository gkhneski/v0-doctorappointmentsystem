"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Template = {
  id: string
  name: string
  content: string
  type: string
  created_at: string
  updated_at: string
}

type Props = {
  templates: Template[]
}

export function SmsTemplatesManager({ templates: initialTemplates }: Props) {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [isOpen, setIsOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = () => {
    setEditingTemplate(null)
    setName("")
    setContent("")
    setIsOpen(true)
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setName(template.name)
    setContent(template.content)
    setIsOpen(true)
  }

  const handleSubmit = async () => {
    if (!name || !content) {
      toast({
        title: "Hata",
        description: "Lütfen tüm alanları doldurunuz",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (editingTemplate) {
        // Update existing template
        const response = await fetch(`/api/admin/sms-templates/${editingTemplate.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, content }),
        })

        if (!response.ok) throw new Error("Şablon güncellenemedi")

        const updated = await response.json()
        setTemplates(templates.map((t) => (t.id === editingTemplate.id ? updated : t)))

        toast({
          title: "Başarılı",
          description: "Şablon güncellendi",
        })
      } else {
        // Create new template
        const response = await fetch("/api/admin/sms-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, content, type: "sms" }),
        })

        if (!response.ok) throw new Error("Şablon oluşturulamadı")

        const newTemplate = await response.json()
        setTemplates([newTemplate, ...templates])

        toast({
          title: "Başarılı",
          description: "Şablon oluşturuldu",
        })
      }

      setIsOpen(false)
      setName("")
      setContent("")
    } catch (error) {
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu şablonu silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/admin/sms-templates/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Şablon silinemedi")

      setTemplates(templates.filter((t) => t.id !== id))

      toast({
        title: "Başarılı",
        description: "Şablon silindi",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SMS Şablonları</CardTitle>
              <CardDescription>
                Hastalara SMS göndermek için şablonlar oluşturun. {"{isim}"} yazdığınız yerlere otomatik hasta adı
                gelir.
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Şablon
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">Henüz şablon yok</h3>
              <p className="mb-4 text-sm text-gray-600">Başlamak için yeni bir SMS şablonu oluşturun</p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                İlk Şablonu Oluştur
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Şablon Adı</TableHead>
                    <TableHead>İçerik</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell className="max-w-md truncate text-sm text-gray-600">{template.content}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Şablonu Düzenle" : "Yeni SMS Şablonu"}</DialogTitle>
            <DialogDescription>
              Şablon oluştururken {"{isim}"} yazdığınız yerlere hasta adı otomatik gelir.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Şablon Adı</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Randevu Hatırlatma"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">SMS İçeriği</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={'Örn: Sayın {isim}, yarınki randevunuzu hatırlatmak isteriz.'}
                rows={5}
              />
              <p className="text-xs text-gray-500">Maksimum 160 karakter (1 SMS)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Kaydediliyor..." : editingTemplate ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
