"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Award } from "lucide-react"

interface RewardsCardProps {
  poolExists: boolean
  pendingRewards: string
  onClaimRewards: () => Promise<boolean>
  disabled: boolean
}

export function RewardsCard({ poolExists, pendingRewards, onClaimRewards, disabled }: RewardsCardProps) {
  const [isClaiming, setIsClaiming] = useState(false)

  // فرمت کردن عدد با 6 رقم اعشار
  const formatNumber = (num: string) => {
    const value = Number.parseFloat(num)
    return isNaN(value) ? "0" : value.toFixed(6)
  }

  const handleClaimRewards = async () => {
    if (disabled || !poolExists || Number.parseFloat(pendingRewards) <= 0) return

    setIsClaiming(true)
    try {
      await onClaimRewards()
    } finally {
      setIsClaiming(false)
    }
  }

  if (!poolExists) {
    return null
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Award className="h-5 w-5 ml-2 text-yellow-500" />
          پاداش‌های استخر
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <span className="text-muted-foreground">پاداش قابل برداشت:</span>
          <span className="font-medium">{formatNumber(pendingRewards)} ETH</span>
        </div>
        <Button
          className="w-full"
          variant={Number.parseFloat(pendingRewards) > 0 ? "default" : "outline"}
          onClick={handleClaimRewards}
          disabled={disabled || isClaiming || Number.parseFloat(pendingRewards) <= 0}
        >
          {isClaiming ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              در حال برداشت پاداش...
            </>
          ) : (
            "برداشت پاداش"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

