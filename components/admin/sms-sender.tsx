"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { EMPTY_SELECTION, applyItemsBlock, buildItemsBlock, toggleItem, type SelectedItems } from "@/lib/sms-item-list"

type Template = {
  id: string
  name: string
  content: string
  category: string
  is_list: boolean
}

type PredefinedList = {
  id: string
  name: string
  category: string
  items: string[]
}

type Props = {
  patientId: string
  patientName: string
  patientPhone: string
}

export function SmsSender({ patientId, patientName, patientPhone }: Props) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [predefinedLists, setPredefinedListsState] = useState<PredefinedList[]>([])
  const [selectedItems, setSelectedItems] = useState<SelectedItems>(EMPTY_SELECTION)
  // Mesajın içinde şu an duran, kutucuklardan üretilmiş bölüm.
  const [itemsBlock, setItemsBlock] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [selectedPredefinedLists, setSelectedPredefinedLists] = useState<Record<string, boolean>>({})
  const [listContents, setListContents] = useState<Record<string, string>>({})

  // Kutucuk işaretlendiği anda mesaj güncellenir; ayrı bir ekleme adımı yoktur.
  const handleItemToggle = (category: keyof SelectedItems, item: string) => {
    const nextSelection = toggleItem(selectedItems, category, item)
    const nextBlock = buildItemsBlock(nextSelection)
    setSelectedItems(nextSelection)
    setMessage(applyItemsBlock(message, itemsBlock, nextBlock, patientName))
    setItemsBlock(nextBlock)
  }

  const resetForm = () => {
    setMessage("")
    setSelectedTemplate("")
    setSelectedItems(EMPTY_SELECTION)
    setItemsBlock("")
  }

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      // Load regular templates
      const { data: templatesData } = await supabase
        .from("message_templates")
        .select("id, name, content")
        .eq("type", "sms")
        .eq("is_list", false)

      if (templatesData) {
        setTemplates(templatesData as any)
      }

      // Load predefined lists
      const { data: listsData } = await supabase
        .from("predefined_lists")
        .select("*")
        .order("category", { ascending: true })

      if (listsData) {
        setPredefinedListsState(listsData as any)
      }
    }

    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      const personalizedMessage = template.content.replace(/{isim}/g, patientName)
      // Daha önce işaretlenmiş öğeler şablonun altına taşınır.
      const block = buildItemsBlock(selectedItems)
      setMessage(applyItemsBlock(personalizedMessage, "", block, patientName))
      setItemsBlock(block)
    }
  }

  const handlePredefinedListToggle = (listId: string) => {
    setSelectedPredefinedLists((prev) => ({
      ...prev,
      [listId]: !prev[listId],
    }))
  }

  const handleCombineLists = () => {
    const selectedIds = Object.keys(selectedPredefinedLists).filter((id) => selectedPredefinedLists[id])
    
    if (selectedIds.length === 0) {
      toast({
        title: "Uyarı",
        description: "Lütfen en az bir liste seçin",
        variant: "destructive",
      })
      return
    }

    let combinedMessage = `Merhaba ${patientName},\n\n`
    
    selectedIds.forEach((id) => {
      const list = predefinedLists.find((l) => l.id === id)
      
      if (list) {
        const categoryName = list.category === "medication" 
          ? "İlaçlarınız" 
          : list.category === "vitamin" 
          ? "Vitaminleriniz" 
          : "Tahlilleriniz"
        
        combinedMessage += `${categoryName}:\n${list.items.map(item => `- ${item}`).join("\n")}\n\n`
      }
    })

    setMessage(combinedMessage.trim())
    toast({
      title: "Başarılı",
      description: "Listeler birleştirildi. İnceleyip gönderin.",
    })
  }

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen mesaj içeriği girin",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)

    try {
      const response = await fetch("/api/admin/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          patientPhone,
          message,
          templateId: selectedTemplate || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "SMS gönderilemedi")
      }

      toast({
        title: "Başarılı",
        description: "SMS başarıyla gönderildi",
      })

      setIsOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "SMS gönderilemedi",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <MessageSquare className="mr-2 h-4 w-4" />
        SMS Gönder
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>SMS Gönder</DialogTitle>
            <DialogDescription>
              {patientName} adlı hastaya ({patientPhone}) SMS gönderin
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label htmlFor="template">Hızlı Şablon Seç</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger id="template">
                  <SelectValue placeholder="Şablon seçin" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {predefinedLists.length > 0 && (
              <div className="space-y-3 rounded-lg border p-4">
                <div>
                  <Label>İlaç/Vitamin/Tahlil Seç</Label>
                  <p className="text-xs text-gray-500">İşaretlediğiniz öğeler mesaja kendiliğinden eklenir.</p>
                </div>

                {/* Get all unique items from all lists by category */}
                {(() => {
                  const medicationItems = Array.from(
                    new Set(
                      predefinedLists
                        .filter((l) => l.category === "medication")
                        .flatMap((l) => l.items)
                    )
                  )
                  const vitaminItems = Array.from(
                    new Set(
                      predefinedLists
                        .filter((l) => l.category === "vitamin")
                        .flatMap((l) => l.items)
                    )
                  )
                  const testItems = Array.from(
                    new Set(
                      predefinedLists
                        .filter((l) => l.category === "test")
                        .flatMap((l) => l.items)
                    )
                  )

                  return (
                    <>
                      {/* Medications */}
                      {medicationItems.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">İlaçlar</Label>
                          <div className="grid grid-cols-1 gap-2">
                            {medicationItems.map((item) => (
                              <div key={item} className="flex items-center gap-2">
                                <Checkbox
                                  id={`med-${item}`}
                                  checked={selectedItems.medication.includes(item)}
                                  onCheckedChange={() => handleItemToggle("medication", item)}
                                />
                                <Label htmlFor={`med-${item}`} className="cursor-pointer font-normal">
                                  {item}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Vitamins */}
                      {vitaminItems.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Vitaminler</Label>
                          <div className="grid grid-cols-1 gap-2">
                            {vitaminItems.map((item) => (
                              <div key={item} className="flex items-center gap-2">
                                <Checkbox
                                  id={`vit-${item}`}
                                  checked={selectedItems.vitamin.includes(item)}
                                  onCheckedChange={() => handleItemToggle("vitamin", item)}
                                />
                                <Label htmlFor={`vit-${item}`} className="cursor-pointer font-normal">
                                  {item}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tests */}
                      {testItems.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Tahliller ve Evraklar</Label>
                          <div className="grid grid-cols-1 gap-2">
                            {testItems.map((item) => (
                              <div key={item} className="flex items-center gap-2">
                                <Checkbox
                                  id={`test-${item}`}
                                  checked={selectedItems.test.includes(item)}
                                  onCheckedChange={() => handleItemToggle("test", item)}
                                />
                                <Label htmlFor={`test-${item}`} className="cursor-pointer font-normal">
                                  {item}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message">Mesaj İçeriği</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="SMS mesajınızı yazın veya yukarıdan şablon/liste seçin..."
                rows={6}
              />
              <p className="text-xs text-gray-500">{message.length} karakter</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false)
                resetForm()
              }}
            >
              İptal
            </Button>
            <Button onClick={handleSend} disabled={isSending}>
              {isSending ? "Gönderiliyor..." : "SMS Gönder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
