"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Bold, Italic, Underline, List, ListOrdered, ChevronDown } from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  label?: string
  placeholder?: string
}

const TEXT_COLORS = [
  { name: "Siyah", value: "#000000" },
  { name: "Kırmızı", value: "#DC2626" },
  { name: "Mavi", value: "#2563EB" },
  { name: "Yeşil", value: "#16A34A" },
  { name: "Turuncu", value: "#EA580C" },
  { name: "Mor", value: "#9333EA" },
  { name: "Gri", value: "#6B7280" },
  { name: "Kahverengi", value: "#92400E" },
]

const BG_COLORS = [
  { name: "Yok", value: "transparent" },
  { name: "Sarı", value: "#FEF08A" },
  { name: "Açık Mavi", value: "#BAE6FD" },
  { name: "Açık Yeşil", value: "#BBF7D0" },
  { name: "Açık Kırmızı", value: "#FECACA" },
  { name: "Açık Mor", value: "#E9D5FF" },
  { name: "Açık Turuncu", value: "#FED7AA" },
  { name: "Açık Gri", value: "#E5E7EB" },
]

export function RichTextEditor({ value, onChange, label, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ""
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="border rounded-md">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => execCommand("bold")}
            className="h-8 w-8 p-0"
            title="Kalın"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => execCommand("italic")}
            className="h-8 w-8 p-0"
            title="İtalik"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => execCommand("underline")}
            className="h-8 w-8 p-0"
            title="Altı Çizili"
          >
            <Underline className="h-4 w-4" />
          </Button>

          <div className="w-px h-8 bg-gray-300 mx-1" />

          {/* Text Color Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2 gap-1 bg-transparent"
                title="Metin Rengi"
              >
                <span className="text-xs font-medium">A</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {TEXT_COLORS.map((color) => (
                <DropdownMenuItem
                  key={color.value}
                  onClick={() => execCommand("foreColor", color.value)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-sm">{color.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Background Color Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2 gap-1 bg-transparent"
                title="Arkaplan Rengi"
              >
                <span className="text-xs font-medium">BG</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {BG_COLORS.map((color) => (
                <DropdownMenuItem
                  key={color.value}
                  onClick={() => execCommand("backColor", color.value)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{
                        backgroundColor: color.value,
                        backgroundImage:
                          color.value === "transparent"
                            ? "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)"
                            : undefined,
                        backgroundSize: color.value === "transparent" ? "8px 8px" : undefined,
                        backgroundPosition: color.value === "transparent" ? "0 0, 4px 4px" : undefined,
                      }}
                    />
                    <span className="text-sm">{color.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-8 bg-gray-300 mx-1" />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => execCommand("insertUnorderedList")}
            className="h-8 w-8 p-0"
            title="Madde İşaretli Liste"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => execCommand("insertOrderedList")}
            className="h-8 w-8 p-0"
            title="Numaralı Liste"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`min-h-[200px] p-4 outline-none prose prose-sm max-w-none ${
            isFocused ? "ring-2 ring-ring ring-offset-2" : ""
          } ${!value && !isFocused ? "text-gray-400" : ""}`}
          data-placeholder={placeholder}
          style={{
            whiteSpace: "pre-wrap",
          }}
        />
      </div>
    </div>
  )
}
