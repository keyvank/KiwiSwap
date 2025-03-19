"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { TokenInput } from "@/components/token-input"
import { PoolStats } from "@/components/pool-stats"
import { RewardsCard } from "@/components/rewards-card"
import { cn } from "@/lib/utils"

interface LiquidityFormProps {
  tokenA: string
  tokenB: string
  tokenAAddress: string
  tokenBAddress: string
  balanceA: string
  balanceB: string
  poolExists: boolean
  reservoirA: string
  reservoirB: string
  pendingRewards: string
  lpTokens: string
  onTokenASelect: (token: string, address: string) => void
  onTokenBSelect: (token: string, address: string) => void
  onAddLiquidity: (amountA: string, amountB: string, onSuccess?: () => void) => Promise<boolean>
  onClaimRewards: () => Promise<boolean>
  disabled: boolean
  isExpanded: boolean
  showPoolInfo: boolean
  onToggleExpand: () => void
}

export function LiquidityForm({
  tokenA,
  tokenB,
  tokenAAddress,
  tokenBAddress,
  balanceA,
  balanceB,
  poolExists,
  reservoirA,
  reservoirB,
  pendingRewards,
  lpTokens,
  onTokenASelect,
  onTokenBSelect,
  onAddLiquidity,
  onClaimRewards,
  disabled,
  isExpanded,
  showPoolInfo,
  onToggleExpand,
}: LiquidityFormProps) {
  const [tokenAAmount, setTokenAAmount] = useState("")
  const [tokenBAmount, setTokenBAmount] = useState("")
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false)

  const handleLiquidityTokenAChange = (e) => {
    setTokenAAmount(e.target.value)
  }

  const handleLiquidityTokenBChange = (e) => {
    setTokenBAmount(e.target.value)
  }

  const handleAddLiquidity = async () => {
    setIsAddingLiquidity(true)
    try {
      const success = await onAddLiquidity(tokenAAmount, tokenBAmount, () => {
        // پاک کردن مقادیر
        setTokenAAmount("")
        setTokenBAmount("")
      })

      if (success && !tokenAAmount && !tokenBAmount) {
        // اگر onSuccess اجرا نشد، اینجا مقادیر را پاک می‌کنیم
        setTokenAAmount("")
        setTokenBAmount("")
      }
    } finally {
      setIsAddingLiquidity(false)
    }
  }

  return (
    <div className="relative">
      <div
        className={cn(
          "grid transition-all duration-500 ease-in-out gap-6",
          isExpanded ? "md:grid-cols-2" : "grid-cols-1",
        )}
      >
        <div className="space-y-4">
          <TokenInput
            id="liquidityTokenA"
            label="توکن اول"
            value={tokenAAmount}
            token={tokenA}
            balance={balanceA}
            onChange={handleLiquidityTokenAChange}
            onTokenSelect={onTokenASelect}
          />

          <div className="flex justify-center">
            <Button variant="outline" size="icon" className="rounded-full">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <TokenInput
            id="liquidityTokenB"
            label="توکن دوم"
            value={tokenBAmount}
            token={tokenB}
            balance={balanceB}
            onChange={handleLiquidityTokenBChange}
            onTokenSelect={onTokenBSelect}
          />

          <Button
            className="w-full"
            onClick={handleAddLiquidity}
            disabled={disabled || isAddingLiquidity || !tokenAAmount || !tokenBAmount}
          >
            {isAddingLiquidity ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                در حال افزودن نقدینگی...
              </>
            ) : (
              "افزودن نقدینگی"
            )}
          </Button>

          {/* کارت پاداش‌ها - فقط در حالت موبایل یا وقتی گسترده نیست */}
          <div className={cn("md:hidden", !isExpanded ? "block" : "hidden")}>
            {poolExists && (
              <RewardsCard
                poolExists={poolExists}
                pendingRewards={pendingRewards}
                onClaimRewards={onClaimRewards}
                disabled={disabled}
              />
            )}
          </div>
        </div>

        {/* اطلاعات استخر و سهم کاربر - فقط در حالت گسترده */}
        <div
          className={cn(
            "transition-opacity duration-300",
            showPoolInfo && isExpanded ? "opacity-100" : "opacity-0 md:absolute md:pointer-events-none",
          )}
        >
          <div className="space-y-6">
            <PoolStats
              exists={poolExists}
              tokenA={tokenA}
              tokenB={tokenB}
              reservoirA={reservoirA}
              reservoirB={reservoirB}
              lpTokens={lpTokens}
            />

            {/* کارت پاداش‌ها - فقط در حالت دسکتاپ و گسترده */}
            {poolExists && (
              <div className="hidden md:block">
                <RewardsCard
                  poolExists={poolExists}
                  pendingRewards={pendingRewards}
                  onClaimRewards={onClaimRewards}
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* دکمه برای تغییر حالت گسترده/فشرده - فقط در حالت دسکتاپ */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1/2 -translate-y-1/2 -left-12 hidden md:flex"
        onClick={onToggleExpand}
      >
        {isExpanded ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
    </div>
  )
}

