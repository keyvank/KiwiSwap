"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Droplets, Coins, ArrowDown, ArrowDownRight, Info } from "lucide-react"
import { TokenInput } from "@/components/token-input"
import { PoolStats } from "@/components/pool-stats"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/utils"

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
  lpTokens: string
  totalLpSupply: string
  onTokenASelect: (token: string, address: string) => void
  onTokenBSelect: (token: string, address: string) => void
  onAddLiquidity: (amountA: string, amountB: string, onSuccess?: () => void) => Promise<boolean>
  onRemoveLiquidity: (liquidity: string, onSuccess?: () => void) => Promise<boolean>
  estimateLPTokens: (amountA: string, amountB: string) => Promise<string>
  disabled: boolean
  isExpanded: boolean
  showPoolInfo: boolean
  onToggleExpand: () => void
  onGetRemovalPreview: (amount: string) => Promise<{ amountA: string; amountB: string }>
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
  lpTokens,
  totalLpSupply,
  onTokenASelect,
  onTokenBSelect,
  onAddLiquidity,
  onRemoveLiquidity,
  estimateLPTokens,
  disabled,
  isExpanded,
  showPoolInfo,
  onToggleExpand,
  onGetRemovalPreview,
}: LiquidityFormProps) {
  const [tokenAAmount, setTokenAAmount] = useState("")
  const [tokenBAmount, setTokenBAmount] = useState("")
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false)
  const [isRemovingLiquidity, setIsRemovingLiquidity] = useState(false)
  const [removalPreview, setRemovalPreview] = useState({ amountA: "0", amountB: "0" })
  const [previewLiquidity, setPreviewLiquidity] = useState("")
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [estimatedLPTokens, setEstimatedLPTokens] = useState("0")
  const [isEstimatingLP, setIsEstimatingLP] = useState(false)

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
        setEstimatedLPTokens("0")
      })

      if (success && !tokenAAmount && !tokenBAmount) {
        // اگر onSuccess اجرا نشد، اینجا مقادیر را پاک می‌کنیم
        setTokenAAmount("")
        setTokenBAmount("")
        setEstimatedLPTokens("0")
      }
    } finally {
      setIsAddingLiquidity(false)
    }
  }

  const handleRemoveLiquidity = async () => {
    if (!previewLiquidity || Number(previewLiquidity) <= 0) return

    setIsRemovingLiquidity(true)
    try {
      const success = await onRemoveLiquidity(previewLiquidity, () => {
        // پاک کردن مقادیر
        setPreviewLiquidity("")
        setRemovalPreview({ amountA: "0", amountB: "0" })
      })
    } finally {
      setIsRemovingLiquidity(false)
    }
  }

  // تخمین تعداد توکن‌های LP که صادر خواهد شد
  useEffect(() => {
    const updateLPEstimate = async () => {
      if (tokenAAmount && tokenBAmount && Number.parseFloat(tokenAAmount) > 0 && Number.parseFloat(tokenBAmount) > 0) {
        setIsEstimatingLP(true)
        try {
          const estimated = await estimateLPTokens(tokenAAmount, tokenBAmount)
          setEstimatedLPTokens(estimated)
        } catch (error) {
          console.error("Error estimating LP tokens:", error)
          setEstimatedLPTokens("0")
        } finally {
          setIsEstimatingLP(false)
        }
      } else {
        setEstimatedLPTokens("0")
      }
    }

    // Use a debounce to avoid too many requests
    const timeoutId = setTimeout(() => {
      updateLPEstimate()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [tokenAAmount, tokenBAmount, estimateLPTokens])

  useEffect(() => {
    const updatePreview = async () => {
      if (previewLiquidity && Number(previewLiquidity) > 0) {
        setIsLoadingPreview(true)
        try {
          const preview = await onGetRemovalPreview(previewLiquidity)
          setRemovalPreview(preview)
        } catch (error) {
          console.error("Error fetching preview:", error)
          setRemovalPreview({ amountA: "0", amountB: "0" })
        } finally {
          setIsLoadingPreview(false)
        }
      } else {
        setRemovalPreview({ amountA: "0", amountB: "0" })
      }
    }

    // Use a debounce to avoid too many requests
    const timeoutId = setTimeout(() => {
      updatePreview()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [previewLiquidity, onGetRemovalPreview])

  return (
    <div className="relative" dir="rtl">
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

          {tokenAAmount &&
            tokenBAmount &&
            Number.parseFloat(tokenAAmount) > 0 &&
            Number.parseFloat(tokenBAmount) > 0 && (
              <div className="p-3 bg-secondary/50 rounded-lg border border-primary/10">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">تخمین توکن‌های LP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">توکن‌های LP دریافتی:</span>
                  {isEstimatingLP ? (
                    <div className="flex items-center">
                      <Loader2 className="h-3 w-3 animate-spin ml-1" />
                      <span className="text-sm">در حال محاسبه...</span>
                    </div>
                  ) : (
                    <span className="text-sm font-medium">{formatNumber(estimatedLPTokens)}</span>
                  )}
                </div>
              </div>
            )}

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

          {poolExists && (
            <div className="mt-6 p-4 bg-secondary/50 rounded-lg border border-primary/10">
              <h3 className="text-md font-medium mb-3 flex items-center">
                <Droplets className="h-5 w-5 ml-2 text-primary" />
                برداشت نقدینگی
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="number"
                    placeholder="مقدار توکن LP"
                    value={previewLiquidity}
                    onChange={(e) => setPreviewLiquidity(e.target.value)}
                    className="flex-1 px-3 py-2 bg-background rounded-lg text-sm"
                  />
                  <span className="mr-2 text-sm flex items-center">
                    <Coins className="h-4 w-4 ml-1" />
                    LP
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-background/50 rounded p-2 border border-primary/5">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center">
                      <ArrowDownRight className="h-3 w-3 ml-1 text-primary" />
                      توکن {tokenA}
                    </div>
                    {isLoadingPreview ? (
                      <div className="flex justify-center py-1">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="font-medium">{formatNumber(removalPreview.amountA)}</div>
                    )}
                  </div>
                  <div className="bg-background/50 rounded p-2 border border-primary/5">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center">
                      <ArrowDownRight className="h-3 w-3 ml-1 text-primary" />
                      توکن {tokenB}
                    </div>
                    {isLoadingPreview ? (
                      <div className="flex justify-center py-1">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="font-medium">{formatNumber(removalPreview.amountB)}</div>
                    )}
                  </div>
                </div>

                <Button
                  className="w-full mt-2"
                  variant="default"
                  onClick={handleRemoveLiquidity}
                  disabled={
                    disabled ||
                    isRemovingLiquidity ||
                    !previewLiquidity ||
                    Number(previewLiquidity) <= 0 ||
                    Number(previewLiquidity) > Number(lpTokens)
                  }
                >
                  {isRemovingLiquidity ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      در حال برداشت نقدینگی...
                    </>
                  ) : (
                    <>
                      <ArrowDown className="ml-2 h-4 w-4" />
                      برداشت نقدینگی
                    </>
                  )}
                </Button>

                {Number(previewLiquidity) > Number(lpTokens) && (
                  <div className="text-xs text-destructive mt-1">
                    مقدار وارد شده بیشتر از موجودی شما ({formatNumber(lpTokens)} LP) است.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* اطلاعات استخر و سهم کاربر - فقط در حالت گسترده */}
        <div
          className={cn(
            "transition-opacity duration-300 h-full",
            showPoolInfo && isExpanded ? "opacity-100" : "opacity-0 md:absolute md:pointer-events-none",
          )}
        >
          <PoolStats
            exists={poolExists}
            tokenA={tokenA}
            tokenB={tokenB}
            reservoirA={reservoirA}
            reservoirB={reservoirB}
            lpTokens={lpTokens}
            totalLpSupply={totalLpSupply}
          />
        </div>
      </div>
    </div>
  )
}

