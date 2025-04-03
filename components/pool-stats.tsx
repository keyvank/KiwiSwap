"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Droplets, Coins, PieChart } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { TOKEN_PRIORITY } from "@/lib/token-priority"

interface PoolStatsProps {
  exists: boolean
  tokenA: string
  tokenB: string
  reservoirA: string
  reservoirB: string
  lpTokens: string
  totalLpSupply: string
}

export function PoolStats({ exists, tokenA, tokenB, reservoirA, reservoirB, lpTokens, totalLpSupply }: PoolStatsProps) {
  // فرمت کردن عدد با 6 رقم اعشار
  const formatNumber = (num: string) => {
    const value = Number.parseFloat(num)
    return isNaN(value) ? "0" : value.toFixed(6)
  }

  // محاسبه درصد سهم کاربر از استخر با استفاده از totalSupply واقعی
  const calculateSharePercentage = () => {
    const lpValue = Number.parseFloat(lpTokens)
    const totalSupply = Number.parseFloat(totalLpSupply)

    // اگر کاربر توکن LP ندارد یا استخر وجود ندارد یا کل توکن‌های LP صفر است، سهم صفر است
    if (!exists || isNaN(lpValue) || lpValue <= 0 || isNaN(totalSupply) || totalSupply <= 0) {
      return "0"
    }

    // محاسبه دقیق سهم کاربر با استفاده از کل توکن‌های LP
    const sharePercentage = (lpValue / totalSupply) * 100
    return sharePercentage.toFixed(2)
  }

  // Function to get the pool ratio display based on token priority
  const getPoolRatioDisplay = () => {
    if (
      !exists ||
      !reservoirA ||
      !reservoirB ||
      Number.parseFloat(reservoirA) <= 0 ||
      Number.parseFloat(reservoirB) <= 0
    ) {
      return "N/A"
    }

    // Get priority of each token (default to -1 if not in the list)
    const priorityA = TOKEN_PRIORITY[tokenA] ?? -1
    const priorityB = TOKEN_PRIORITY[tokenB] ?? -1

    // If token A has higher or equal priority, show A as base
    if (priorityA < priorityB) {
      const rate = (Number.parseFloat(reservoirB) / Number.parseFloat(reservoirA)).toFixed(6)
      return `1 ${tokenA} = ${rate} ${tokenB}`
    }
    // Otherwise show B as base
    else {
      const rate = (Number.parseFloat(reservoirA) / Number.parseFloat(reservoirB)).toFixed(6)
      return `1 ${tokenB} = ${rate} ${tokenA}`
    }
  }

  if (!exists) {
    return (
      <Card className="bg-secondary/50 border-dashed border-muted">
        <CardContent className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <Droplets className="h-12 w-12 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-lg font-medium mb-2">استخری وجود ندارد</h3>
          <p className="text-sm text-muted-foreground">
            برای این جفت توکن استخری وجود ندارد. با افزودن نقدینگی، استخر جدیدی ایجاد خواهید کرد.
          </p>
        </CardContent>
      </Card>
    )
  }

  const sharePercentage = calculateSharePercentage()

  return (
    <Card className="border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">اطلاعات استخر</h3>
          <div className="flex items-center gap-1 text-primary">
            <Droplets className="h-5 w-5" />
          </div>
        </div>

        <div className="space-y-4">
          {/* موجودی استخر */}
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">موجودی استخر</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background/50 rounded p-2">
                <div className="text-xs text-muted-foreground mb-1">توکن {tokenA}</div>
                <div className="font-medium">{formatNumber(reservoirA)}</div>
              </div>
              <div className="bg-background/50 rounded p-2">
                <div className="text-xs text-muted-foreground mb-1">توکن {tokenB}</div>
                <div className="font-medium">{formatNumber(reservoirB)}</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              نسبت:{" "}
              <span dir="ltr" className="font-mono">
                {getPoolRatioDisplay()}
              </span>
            </div>
          </div>

          <Separator />

          {/* توکن‌های LP کاربر */}
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">سهم شما از استخر</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background/50 rounded p-2">
                <div className="text-xs text-muted-foreground mb-1">توکن‌های LP</div>
                <div className="font-medium">{formatNumber(lpTokens)}</div>
              </div>
              <div className="bg-background/50 rounded p-2">
                <div className="text-xs text-muted-foreground mb-1">درصد سهم</div>
                <div className="font-medium">{sharePercentage}%</div>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center mt-2">
            با افزودن یا برداشت نقدینگی، تعداد توکن‌های LP و سهم شما از استخر تغییر می‌کند.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

