import * as React from "react"
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  label?: string
  id?: string
}

export function TimePicker({
  value,
  onChange,
  placeholder = "HH:MM",
  className,
  disabled,
  label,
  id,
}: TimePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange?.(newValue)
  }

  return (
    <div className="w-full">
      {label && (
        <Label htmlFor={id} className="mb-2 block">
          {label}
        </Label>
      )}
      <div className="relative">
        <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type="time"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn("pl-10", className)}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
