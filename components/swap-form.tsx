"use client"

import { useState } from "react"
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
  account: string
}

// Define token priority for display (higher index = higher priority as base currency)
const TOKEN_PRIORITY = {
  ETH: 3,
  BTC: 4,
  SOL: 2,
  USDT: 1,
  IRT: 1,
  DOGE: 0,
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
  account,
}: SwapFormProps) {
  const [tokenAAmount, setTokenAAmount] = useState("")
  const [tokenBAmount, setTokenBAmount] = useState("")
  const [direction, setDirection] = useState<"AtoB" | "BtoA">("AtoB")
  const [slippage, setSlippage] = useState("0.5")
  const [minAmountOut, setMinAmountOut] = useState("0")
  const [isSwapping, setIsSwapping] = useState(false)
  // Add isCalculating state to track when we're calculating the output
  const [isCalculating, setIsCalculating] = useState(false)

  // Add a new function to handle slippage changes
  const handleSlippageChange = async (newSlippage: string) => {
    setSlippage(newSlippage)

    // Recalculate minimum amount out based on new slippage
    if (
      (direction === "AtoB" && tokenAAmount && Number.parseFloat(tokenAAmount) > 0) ||
      (direction === "BtoA" && tokenBAmount && Number.parseFloat(tokenBAmount) > 0)
    ) {
      // Get the current input amount and direction
      const currentAmount = direction === "AtoB" ? tokenAAmount : tokenBAmount
      const currentDirection = direction === "AtoB"

      // Set calculating state
      setIsCalculating(true)

      try {
        // Recalculate with new slippage - properly await the async function
        const { outputAmount, minAmountOut: newMinAmountOut } = await calculateOutput(
          currentAmount,
          currentDirection,
          newSlippage,
        )

        // Update the minimum amount out and ensure output amount stays the same
        setMinAmountOut(newMinAmountOut)

        // Make sure we keep the output amount consistent
        if (direction === "AtoB") {
          setTokenBAmount(outputAmount)
        } else {
          setTokenAAmount(outputAmount)
        }
      } catch (error) {
        console.error("Error recalculating with new slippage:", error)
      } finally {
        setIsCalculating(false)
      }
    }
  }

  // Update the handleTokenAChange function to show loading state
  const handleTokenAChange = async (e) => {
    setDirection("AtoB")
    setTokenAAmount(e.target.value)

    if (!e.target.value || Number.parseFloat(e.target.value) <= 0) {
      setTokenBAmount("")
      setMinAmountOut("0")
      return
    }

    // Show loading state while calculating
    setIsCalculating(true)

    try {
      // Calculate the output amount
      const { outputAmount, minAmountOut: minOutput } = await calculateOutput(e.target.value, true, slippage)
      setTokenBAmount(outputAmount)
      setMinAmountOut(minOutput)
    } finally {
      setIsCalculating(false)
    }
  }

  // Update the handleTokenBChange function to show loading state
  const handleTokenBChange = async (e) => {
    setDirection("BtoA")
    setTokenBAmount(e.target.value)

    if (!e.target.value || Number.parseFloat(e.target.value) <= 0) {
      setTokenAAmount("")
      setMinAmountOut("0")
      return
    }

    // Show loading state while calculating
    setIsCalculating(true)

    try {
      // Calculate the output amount
      const { outputAmount, minAmountOut: minOutput } = await calculateOutput(e.target.value, false, slippage)
      setTokenAAmount(outputAmount)
      setMinAmountOut(minOutput)
    } finally {
      setIsCalculating(false)
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

  // Determine which token should be the base currency for the exchange rate display
  const getExchangeRateDisplay = () => {
    // Get priority of each token (default to -1 if not in the list)
    const priorityA = TOKEN_PRIORITY[tokenA] ?? -1
    const priorityB = TOKEN_PRIORITY[tokenB] ?? -1

    // If we have valid input and output amounts
    if (tokenAAmount && tokenBAmount && Number.parseFloat(tokenAAmount) > 0 && Number.parseFloat(tokenBAmount) > 0) {
      // If token A has higher or equal priority, show A as base
      if (priorityA >= priorityB) {
        const rate = (Number.parseFloat(tokenBAmount) / Number.parseFloat(tokenAAmount)).toFixed(6)
        return (
          <span dir="ltr" className="font-mono">
            1 {tokenA} = {rate} {tokenB}
          </span>
        )
      }
      // Otherwise show B as base
      else {
        const rate = (Number.parseFloat(tokenAAmount) / Number.parseFloat(tokenBAmount)).toFixed(6)
        return (
          <span dir="ltr" className="font-mono">
            1 {tokenB} = {rate} {tokenA}
          </span>
        )
      }
    }

    // Fallback to default exchange rate
    return (
      <span dir="ltr" className="font-mono">
        1 {tokenA} = {Number.parseFloat(exchangeRate).toFixed(6)} {tokenB}
      </span>
    )
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
        isCalculating={direction === "BtoA" && isCalculating}
        readOnly={direction === "BtoA"} // Read-only when it's the output field
        extraInfo={
          direction === "BtoA" &&
          tokenBAmount &&
          Number.parseFloat(tokenBAmount) > 0 &&
          poolExists && (
            <div className="text-xs text-muted-foreground text-right mt-1">
              شما دریافت خواهید کرد: حداقل{" "}
              <span dir="ltr" className="inline-block font-mono">
                {formatNumber(minAmountOut)} {tokenA}
              </span>
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
        isCalculating={direction === "AtoB" && isCalculating}
        readOnly={direction === "AtoB"} // Read-only when it's the output field
        extraInfo={
          direction === "AtoB" &&
          tokenAAmount &&
          Number.parseFloat(tokenAAmount) > 0 &&
          poolExists && (
            <div className="text-xs text-muted-foreground text-right mt-1">
              شما دریافت خواهید کرد: حداقل{" "}
              <span dir="ltr" className="inline-block font-mono">
                {formatNumber(minAmountOut)} {tokenB}
              </span>
            </div>
          )
        }
      />

      {!account ? (
        <div className="p-3 bg-destructive/20 rounded-lg" dir="rtl">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-destructive" />
            <div className="text-sm">
              <p>برای شروع مبادله کیف‌پول خود را متصل کنید.</p>
            </div>
          </div>
        </div>
      ) : (
        !poolExists && (
          <div className="p-3 bg-destructive/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 text-destructive" />
              <div className="text-sm" dir="rtl">
                <p>استخر برای این جفت توکن وجود ندارد. لطفا ابتدا نقدینگی اضافه کنید.</p>
              </div>
            </div>
          </div>
        )
      )}

      {poolExists &&
        ((tokenAAmount && Number.parseFloat(tokenAAmount) > 0) ||
          (tokenBAmount && Number.parseFloat(tokenBAmount) > 0)) && (
          <div className="p-3 bg-secondary rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">نرخ تبدیل</span>
              {getExchangeRateDisplay()}
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">حداکثر لغزش</span>
              <div className="flex items-center gap-2">
                <div className="flex border rounded-md overflow-hidden">
                  <button
                    type="button"
                    className={`px-2 py-1 text-xs ${slippage === "0.1" ? "bg-primary text-primary-foreground" : "bg-background"}`}
                    onClick={() => handleSlippageChange("0.1")}
                  >
                    0.1%
                  </button>
                  <button
                    type="button"
                    className={`px-2 py-1 text-xs ${slippage === "0.5" ? "bg-primary text-primary-foreground" : "bg-background"}`}
                    onClick={() => handleSlippageChange("0.5")}
                  >
                    0.5%
                  </button>
                  <button
                    type="button"
                    className={`px-2 py-1 text-xs ${slippage === "1.0" ? "bg-primary text-primary-foreground" : "bg-background"}`}
                    onClick={() => handleSlippageChange("1.0")}
                  >
                    1.0%
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">حداقل دریافتی</span>
              <span dir="ltr" className="font-mono">
                {formatNumber(minAmountOut)} {direction === "AtoB" ? tokenB : tokenA}
              </span>
            </div>
          </div>
        )}

      <Button
        className="w-full"
        onClick={handleSwap}
        disabled={disabled || !poolExists || isSwapping || !tokenAAmount || !tokenBAmount || isCalculating}
      >
        {isSwapping || isCalculating ? (
          <>
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            {isSwapping ? "در حال مبادله..." : "در حال محاسبه..."}
          </>
        ) : (
          "مبادله"
        )}
      </Button>
    </div>
  )
}

