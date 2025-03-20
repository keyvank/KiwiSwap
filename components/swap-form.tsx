"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowDownUp, Info, Loader2 } from "lucide-react"
import { TokenInput } from "@/components/token-input"

interface SwapFormProps {
  tokenA: string
  tokenB: string
  tokenAAddress: string
  tokenBAddress: string
  balanceA: string
  balanceB: string
  poolExists: boolean
  exchangeRate: string
  onTokenASelect: (token: string, address: string) => void
  onTokenBSelect: (token: string, address: string) => void
  onSwap: (amountIn: string, minAmountOut: string, isAToB: boolean, onSuccess?: () => void) => Promise<boolean>
  calculateOutput: (
    amountIn: string,
    isAToB: boolean,
    slippagePercentage: string,
  ) => { outputAmount: string; minAmountOut: string }
  disabled: boolean
}

export function SwapForm({
  tokenA,
  tokenB,
  tokenAAddress,
  tokenBAddress,
  balanceA,
  balanceB,
  poolExists,
  exchangeRate,
  onTokenASelect,
  onTokenBSelect,
  onSwap,
  calculateOutput,
  disabled,
}: SwapFormProps) {
  const [tokenAAmount, setTokenAAmount] = useState("")
  const [tokenBAmount, setTokenBAmount] = useState("")
  const [direction, setDirection] = useState<"AtoB" | "BtoA">("AtoB")
  const [slippage, setSlippage] = useState("0.5")
  const [minAmountOut, setMinAmountOut] = useState("0")
  const [isSwapping, setIsSwapping] = useState(false)

  // محاسبه مقدار خروجی
  useEffect(() => {
    if (!poolExists) {
      setTokenBAmount("")
      setTokenAAmount("")
      setMinAmountOut("0")
      return
    }

    if (direction === "AtoB" && tokenAAmount && Number.parseFloat(tokenAAmount) > 0) {
      // محاسبه مقدار توکن B که کاربر دریافت خواهد کرد
      const { outputAmount, minAmountOut: minOutput } = calculateOutput(tokenAAmount, true, slippage)
      setTokenBAmount(outputAmount)
      setMinAmountOut(minOutput)
    } else if (direction === "BtoA" && tokenBAmount && Number.parseFloat(tokenBAmount) > 0) {
      // محاسبه مقدار توکن A که کاربر دریافت خواهد کرد
      const { outputAmount, minAmountOut: minOutput } = calculateOutput(tokenBAmount, false, slippage)
      setTokenAAmount(outputAmount)
      setMinAmountOut(minOutput)
    }
  }, [tokenAAmount, tokenBAmount, direction, slippage, poolExists, calculateOutput])

  const handleTokenAChange = (e) => {
    setDirection("AtoB")
    setTokenAAmount(e.target.value)
    if (!e.target.value || Number.parseFloat(e.target.value) <= 0) {
      setTokenBAmount("")
      setMinAmountOut("0")
    }
  }

  const handleTokenBChange = (e) => {
    setDirection("BtoA")
    setTokenBAmount(e.target.value)
    if (!e.target.value || Number.parseFloat(e.target.value) <= 0) {
      setTokenAAmount("")
      setMinAmountOut("0")
    }
  }

  const handleSwapDirection = () => {
    onTokenASelect(tokenB, tokenBAddress)
    onTokenBSelect(tokenA, tokenAAddress)
    setTokenAAmount(tokenBAmount)
    setTokenBAmount(tokenAAmount)
    setDirection(direction === "AtoB" ? "BtoA" : "AtoB")
  }

  const handleSwap = async () => {
    setIsSwapping(true)
    try {
      const success = await onSwap(
        direction === "AtoB" ? tokenAAmount : tokenBAmount,
        minAmountOut,
        direction === "AtoB",
        () => {
          // پاک کردن مقادیر
          setTokenAAmount("")
          setTokenBAmount("")
          setMinAmountOut("0")
        },
      )

      if (success && !tokenAAmount && !tokenBAmount) {
        // اگر onSuccess اجرا نشد، اینجا مقادیر را پاک می‌کنیم
        setTokenAAmount("")
        setTokenBAmount("")
        setMinAmountOut("0")
      }
    } finally {
      setIsSwapping(false)
    }
  }

  // فرمت کردن عدد با 6 رقم اعشار
  const formatNumber = (num: string) => {
    const value = Number.parseFloat(num)
    return isNaN(value) ? "0" : value.toFixed(6)
  }

  return (
    <div className="space-y-4" dir="rtl">
      <TokenInput
        id="tokenA"
        label="از"
        value={tokenAAmount}
        token={tokenA}
        balance={balanceA}
        onChange={handleTokenAChange}
        onTokenSelect={onTokenASelect}
        extraInfo={
          direction === "BtoA" &&
          tokenBAmount &&
          Number.parseFloat(tokenBAmount) > 0 &&
          poolExists && (
            <div className="text-xs text-muted-foreground text-right mt-1">
              شما دریافت خواهید کرد: حداقل {formatNumber(minAmountOut)} {tokenA}
            </div>
          )
        }
      />

      <div className="flex justify-center">
        <Button variant="outline" size="icon" className="rounded-full" onClick={handleSwapDirection}>
          <ArrowDownUp className="h-4 w-4" />
        </Button>
      </div>

      <TokenInput
        id="tokenB"
        label="به"
        value={tokenBAmount}
        token={tokenB}
        balance={balanceB}
        onChange={handleTokenBChange}
        onTokenSelect={onTokenBSelect}
        extraInfo={
          direction === "AtoB" &&
          tokenAAmount &&
          Number.parseFloat(tokenAAmount) > 0 &&
          poolExists && (
            <div className="text-xs text-muted-foreground text-right mt-1">
              شما دریافت خواهید کرد: حداقل {formatNumber(minAmountOut)} {tokenB}
            </div>
          )
        }
      />

      {!poolExists && (
        <div className="p-3 bg-destructive/20 rounded-lg">
          <div className="flex items-start gap-2 flex-row-reverse text-right">
            <Info className="h-4 w-4 mt-0.5 text-destructive" />
            <div className="text-sm" dir="rtl">
              <p>استخر برای این جفت توکن وجود ندارد. لطفا ابتدا نقدینگی اضافه کنید.</p>
            </div>
          </div>
        </div>
      )}

      {poolExists &&
        ((tokenAAmount && Number.parseFloat(tokenAAmount) > 0) ||
          (tokenBAmount && Number.parseFloat(tokenBAmount) > 0)) && (
          <div className="p-3 bg-secondary rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">نرخ تبدیل</span>
              <span>
                1 {tokenA} = {Number.parseFloat(exchangeRate).toFixed(6)} {tokenB}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">حداکثر لغزش</span>
              <span>{slippage}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">حداقل دریافتی</span>
              <span>
                {formatNumber(minAmountOut)} {direction === "AtoB" ? tokenB : tokenA}
              </span>
            </div>
          </div>
        )}

      <Button
        className="w-full"
        onClick={handleSwap}
        disabled={disabled || !poolExists || isSwapping || !tokenAAmount || !tokenBAmount}
      >
        {isSwapping ? (
          <>
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            در حال مبادله...
          </>
        ) : (
          "مبادله"
        )}
      </Button>
    </div>
  )
}

