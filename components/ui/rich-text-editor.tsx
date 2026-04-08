"use client"

import { useEffect, useRef, useCallback } from "react"
import { Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  rows?: number
}

const COLORS = [
  { label: "Siyah", value: "#000000" },
  { label: "Kırmızı", value: "#dc2626" },
  { label: "Mavi", value: "#2563eb" },
  { label: "Yeşil", value: "#16a34a" },
  { label: "Turuncu", value: "#ea580c" },
  { label: "Mor", value: "#9333ea" },
]

export function RichTextEditor({ value, onChange, placeholder, className, rows = 4 }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalChange = useRef(false)

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || ""
      }
    }
    isInternalChange.current = false
  }, [value])

  const exec = useCallback((command: string, val?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, val)
    if (editorRef.current) {
      isInternalChange.current = true
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault()
      exec("insertText", "    ")
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "b") {
      e.preventDefault()
      exec("bold")
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "i") {
      e.preventDefault()
      exec("italic")
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "u") {
      e.preventDefault()
      exec("underline")
    }
  }

  const minHeight = `${rows * 1.75}rem`

  return (
    <div className={cn("rounded-md border border-input bg-background", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/40 px-2 py-1.5">
        <ToolbarButton onClick={() => exec("bold")} title="Kalın (Ctrl+B)">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("italic")} title="İtalik (Ctrl+I)">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("underline")} title="Altı Çizili (Ctrl+U)">
          <Underline className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-border" />

        <ToolbarButton onClick={() => exec("justifyLeft")} title="Sola Hizala">
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("justifyCenter")} title="Ortala">
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("justifyRight")} title="Sağa Hizala">
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-border" />

        <ToolbarButton onClick={() => exec("insertUnorderedList")} title="Liste">
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-border" />

        {/* Font size */}
        <select
          className="h-6 rounded border border-input bg-background px-1 text-xs focus:outline-none"
          title="Yazı Boyutu"
          onChange={(e) => exec("fontSize", e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>Boyut</option>
          <option value="1">Küçük</option>
          <option value="3">Normal</option>
          <option value="5">Büyük</option>
          <option value="7">Çok Büyük</option>
        </select>

        <div className="mx-1 h-4 w-px bg-border" />

        {/* Color dots */}
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => exec("foreColor", c.value)}
              className="h-4 w-4 rounded-full border border-gray-300 transition-transform hover:scale-110 focus:outline-none"
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className={cn(
          "relative px-3 py-2 text-sm focus:outline-none leading-relaxed overflow-y-auto",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none"
        )}
        style={{ minHeight }}
      />
    </div>
  )
}

function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className="flex h-6 w-6 items-center justify-center rounded hover:bg-accent hover:text-accent-foreground focus:outline-none"
    >
      {children}
    </button>
  )
}
