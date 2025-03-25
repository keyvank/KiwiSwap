"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TokenSelector } from "@/components/token-selector"
import { Loader2 } from "lucide-react"

interface TokenInputProps {
  id: string
  label: string
  value: string
  token: string
  balance: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onTokenSelect: (token: string, address: string) => void
  extraInfo?: React.ReactNode
  isCalculating?: boolean
  readOnly?: boolean
}

export function TokenInput({
  id,
  label,
  value,
  token,
  balance,
  onChange,
  onTokenSelect,
  extraInfo,
  isCalculating = false,
  readOnly = false,
}: TokenInputProps) {
  // فرمت کردن عدد با 6 رقم اعشار
  const formatNumber = (num: string) => {
    const value = Number.parseFloat(num)
    return isNaN(value) ? "0" : value.toFixed(6)
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-xs text-muted-foreground">
          موجودی:{" "}
          <span dir="ltr" className="font-mono">
            {formatNumber(balance)} {token}
          </span>
        </span>
      </div>
      <div className="flex space-x-2 space-x-reverse relative" dir="ltr">
        <Input
          id={id}
          type="number"
          lang="en"
          placeholder="0.0"
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          className={`flex-1 rounded-r-none border-r-0 font-mono ${readOnly ? "bg-muted cursor-not-allowed" : ""}`}
        />
        <TokenSelector defaultToken={token} onSelect={onTokenSelect} />

        {/* نشانگر بارگذاری */}
        {isCalculating && (
          <div className="absolute inset-y-0 right-24 flex items-center pr-3">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        )}
      </div>
      {extraInfo}
    </div>
  )
}

