"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface YesNoFieldProps {
  label: string
  value: string
  noteValue: string
  onValueChange: (value: string) => void
  onNoteChange: (note: string) => void
  className?: string
}

export function YesNoField({ label, value, noteValue, onValueChange, onNoteChange, className }: YesNoFieldProps) {
  const showNote = value === "var"

  return (
    <div className={className}>
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Yok" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="var">Var</SelectItem>
            <SelectItem value="yok">Yok</SelectItem>
          </SelectContent>
        </Select>
        {showNote && (
          <Input
            type="text"
            placeholder="Açıklama..."
            className="flex-1"
            value={noteValue}
            onChange={(e) => onNoteChange(e.target.value)}
          />
        )}
      </div>
    </div>
  )
}
