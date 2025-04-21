"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SwapInterface } from "@/components/swap-interface"
import { isValidERC20, getERC20Info, TOKEN_ADDRESSES } from "@/lib/contract-utils"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TokenSwapPageProps {
  tokenAddress: string
}

export function TokenSwapPage({ tokenAddress }: TokenSwapPageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [tokenInfo, setTokenInfo] = useState<{ symbol: string; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const validateToken = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Check if it's a valid ERC20 token
        const valid = await isValidERC20(tokenAddress)
        setIsValid(valid)

        if (valid) {
          // Get token info
          const info = await getERC20Info(tokenAddress)
          setTokenInfo({
            symbol: info.symbol,
            name: info.name,
          })
        } else {
          setError("آدرس وارد شده یک توکن ERC20 معتبر نیست")
        }
      } catch (err) {
        console.error("Error validating token:", err)
        setError("خطا در بررسی توکن. لطفاً دوباره تلاش کنید.")
        setIsValid(false)
      } finally {
        setIsLoading(false)
      }
    }

    validateToken()
  }, [tokenAddress])

  const handleBackToHome = () => {
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">در حال بررسی توکن...</span>
      </div>
    )
  }

  if (!isValid || error) {
    return (
      <div className="max-w-md mx-auto">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>خطا</AlertTitle>
          <AlertDescription>{error || "آدرس توکن نامعتبر است"}</AlertDescription>
        </Alert>
        <Button onClick={handleBackToHome} className="w-full">
          بازگشت به صفحه اصلی
        </Button>
      </div>
    )
  }

  return (
    <>
      {tokenInfo && (
        <div className="text-center mb-4">
          <p className="text-lg">
            مبادله <span className="font-bold">تتر (USDT)</span> به{" "}
            <span className="font-bold">
              {tokenInfo.name} ({tokenInfo.symbol})
            </span>
          </p>
        </div>
      )}
      <SwapInterface
        defaultTokenA="USDT"
        defaultTokenAAddress={TOKEN_ADDRESSES.USDT}
        defaultTokenB={tokenInfo?.symbol || ""}
        defaultTokenBAddress={tokenAddress}
        customToken={
          tokenInfo
            ? {
                symbol: tokenInfo.symbol,
                name: tokenInfo.name,
                address: tokenAddress,
                isCustom: true,
              }
            : undefined
        }
      />
    </>
  )
}

