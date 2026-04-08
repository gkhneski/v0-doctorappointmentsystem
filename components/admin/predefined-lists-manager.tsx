"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pill, Plus, Trash2, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type PredefinedList = {
  id: string
  name: string
  category: "medication" | "vitamin" | "test"
  items: string[]
  created_at: string
}

export function PredefinedListsManager() {
  const { toast } = useToast()
  const [lists, setLists] = useState<PredefinedList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingList, setEditingList] = useState<PredefinedList | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [category, setCategory] = useState<"medication" | "vitamin" | "test">("medication")
  const [itemsText, setItemsText] = useState("")

  useEffect(() => {
    fetchLists()
  }, [])

  async function fetchLists() {
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("predefined_lists")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true })

    if (error) {
      toast({
        title: "Hata",
        description: "Listeler yüklenemedi",
        variant: "destructive",
      })
    } else {
      setLists(data || [])
    }
    setIsLoading(false)
  }

  function handleCreate() {
    setEditingList(null)
    setName("")
    setCategory("medication")
    setItemsText("")
    setDialogOpen(true)
  }

  function handleEdit(list: PredefinedList) {
    setEditingList(list)
    setName(list.name)
    setCategory(list.category)
    setItemsText(list.items.join("\n"))
    setDialogOpen(true)
  }

  async function handleSubmit() {
    if (!name.trim() || !itemsText.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen tüm alanları doldurun",
        variant: "destructive",
      })
      return
    }

    const items = itemsText.split("\n").filter((item) => item.trim())
    const supabase = createClient()

    if (editingList) {
      // Update
      const { error } = await supabase
        .from("predefined_lists")
        .update({ name, category, items })
        .eq("id", editingList.id)

      if (error) {
        toast({
          title: "Hata",
          description: "Liste güncellenemedi",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Başarılı",
          description: "Liste güncellendi",
        })
        setDialogOpen(false)
        fetchLists()
      }
    } else {
      // Create
      const { error } = await supabase.from("predefined_lists").insert({ name, category, items })

      if (error) {
        toast({
          title: "Hata",
          description: "Liste eklenemedi",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Başarılı",
          description: "Liste eklendi",
        })
        setDialogOpen(false)
        fetchLists()
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu listeyi silmek istediğinize emin misiniz?")) return

    const supabase = createClient()
    const { error } = await supabase.from("predefined_lists").delete().eq("id", id)

    if (error) {
      toast({
        title: "Hata",
        description: "Liste silinemedi",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Başarılı",
        description: "Liste silindi",
      })
      fetchLists()
    }
  }

  function getCategoryLabel(category: string) {
    switch (category) {
      case "medication":
        return "İlaç"
      case "vitamin":
        return "Vitamin"
      case "test":
        return "Tahlil"
      default:
        return category
    }
  }

  function getCategoryColor(category: string) {
    switch (category) {
      case "medication":
        return "bg-blue-100 text-blue-700"
      case "vitamin":
        return "bg-green-100 text-green-700"
      case "test":
        return "bg-purple-100 text-purple-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <Pill className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">İlaç/Vitamin/Tahlil Listeleri</h1>
              <p className="text-xs text-gray-600">Hazır listeleri yönetin ve SMS gönderirken kullanın</p>
            </div>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Liste Ekle
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Tüm Listeler</CardTitle>
            <CardDescription>
              SMS gönderirken bu listelerden seçim yaparak hızlıca hasta bilgilendirmesi yapabilirsiniz
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-gray-500">Yükleniyor...</p>
            ) : lists.length === 0 ? (
              <p className="text-center text-gray-500">Henüz liste eklenmemiş</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Liste Adı</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>İçerik</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lists.map((list) => (
                    <TableRow key={list.id}>
                      <TableCell className="font-medium">{list.name}</TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(list.category)}>{getCategoryLabel(list.category)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md truncate text-sm text-gray-600">{list.items.join(", ")}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(list)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(list.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingList ? "Liste Düzenle" : "Yeni Liste Ekle"}</DialogTitle>
            <DialogDescription>
              İlaç, vitamin veya tahlil listesi oluşturun. Her satıra bir öğe yazın.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Liste Adı <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Hamilelik İlaçları"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Kategori <span className="text-destructive">*</span>
              </Label>
              <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medication">İlaç</SelectItem>
                  <SelectItem value="vitamin">Vitamin</SelectItem>
                  <SelectItem value="test">Tahlil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="items">
                İçerik (Her satıra bir öğe) <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="items"
                value={itemsText}
                onChange={(e) => setItemsText(e.target.value)}
                placeholder="Aspirin 100mg&#10;Folik Asit 5mg&#10;Demir Tablet"
                rows={6}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSubmit}>{editingList ? "Güncelle" : "Ekle"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
