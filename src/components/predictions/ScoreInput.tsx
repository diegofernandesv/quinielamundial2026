"use client"
import { MinusIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ScoreInputProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  className?: string
}

export function ScoreInput({ value, onChange, disabled, className }: ScoreInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const n = parseInt(e.target.value, 10)
    if (!isNaN(n) && n >= 0 && n <= 20) onChange(n)
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={disabled || value <= 0}
        className="shrink-0"
      >
        <MinusIcon className="size-3" />
      </Button>
      <Input
        type="number"
        min={0}
        max={20}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="w-12 text-center font-bold text-lg p-0 h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => onChange(Math.min(20, value + 1))}
        disabled={disabled || value >= 20}
        className="shrink-0"
      >
        <PlusIcon className="size-3" />
      </Button>
    </div>
  )
}
