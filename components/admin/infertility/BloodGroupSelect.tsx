"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const BLOOD_GROUPS = ["0 Rh-", "0 Rh+", "A Rh-", "A Rh+", "B Rh-", "B Rh+", "AB Rh-", "AB Rh+"]

interface BloodGroupSelectProps {
  label?: string
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function BloodGroupSelect({ label = "Kan Grubu", value, onValueChange, className }: BloodGroupSelectProps) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Seçiniz" />
        </SelectTrigger>
        <SelectContent>
          {BLOOD_GROUPS.map((group) => (
            <SelectItem key={group} value={group}>
              {group}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
