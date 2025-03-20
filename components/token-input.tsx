"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TokenSelector } from "@/components/token-selector"

interface TokenInputProps {
  id: string
  label: string
  value: string
  token: string
  balance: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onTokenSelect: (token: string, address: string) => void
  extraInfo?: React.ReactNode
}

export function TokenInput({ id, label, value, token, balance, onChange, onTokenSelect, extraInfo }: TokenInputProps) {
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
          موجودی: <span dir="ltr" className="font-mono">{formatNumber(balance)} {token}</span>
        </span>
      </div>
      <div className="flex space-x-2 space-x-reverse" dir="ltr">
        <Input id={id} type="number" lang="en" placeholder="0.0" value={value} onChange={onChange} className="flex-1" />
        <TokenSelector defaultToken={token} onSelect={onTokenSelect} />
      </div>
      {extraInfo}
    </div>
  )
}

