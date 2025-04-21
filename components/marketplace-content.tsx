"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, ExternalLink, ArrowRight, Clock, DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { getRecentlyCreatedPools, type PoolInfo, formatNumberWithSuffix } from "@/lib/marketplace-utils"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/hooks/use-wallet"
import { TOKEN_PRIORITY } from "@/lib/token-priority"

export function MarketplaceContent() {
  const [pools, setPools] = useState<PoolInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { connected, isCorrectNetwork } = useWallet()

  const fetchPools = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const recentPools = await getRecentlyCreatedPools()
      setPools(recentPools)
    } catch (error) {
      console.error("Error fetching pools:", error)
      setError("خطا در دریافت اطلاعات استخرها. لطفا دوباره تلاش کنید.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPools()
  }, [])

  // Format timestamp to local date/time
  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return ""
    const date = new Date(timestamp * 1000)
    return date.toLocaleString("fa-IR")
  }

  // Calculate time ago
  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp)

    if (seconds < 60) return "چند لحظه پیش"

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} دقیقه پیش`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} ساعت پیش`

    const days = Math.floor(hours / 24)
    return `${days} روز پیش`
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">توکن‌های اخیراً اضافه شده</h2>
        <Button variant="outline" size="sm" onClick={fetchPools} disabled={isLoading} className="flex items-center">
          {isLoading ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <RefreshCw className="h-4 w-4 ml-2" />}
          بروزرسانی
        </Button>
      </div>

      {isLoading ? (
        <Card className="w-full">
          <CardContent className="flex justify-center items-center py-12 mt-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="mr-2">در حال بارگذاری استخرها...</span>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="w-full border-destructive/50">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : pools.length === 0 ? (
        <Card className="w-full">
          <CardContent className="p-6 text-center mt-6">
            <p className="text-muted-foreground">هیچ استخری یافت نشد.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {pools.map((pool) => (
            <Card key={pool.id} className={`${pool.isNew ? "border-primary/30 bg-primary/5" : ""} h-full`}>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base flex items-center">
                    {pool.tokenA.symbol} / {pool.tokenB.symbol}
                  </CardTitle>

                  {/* Price Change Badge */}
                  {pool.priceChange && (
                    <Badge
                      variant="outline"
                      className={`
                        ${pool.priceChange.isPositive ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"}
                      `}
                    >
                      <span className="flex items-center text-xs">
                        {pool.priceChange.isPositive ? (
                          <TrendingUp className="h-3 w-3 ml-0.5" />
                        ) : (
                          <TrendingDown className="h-3 w-3 ml-0.5" />
                        )}
                        {pool.priceChange.percentage.toFixed(1)}%
                      </span>
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs mt-1">
                  {pool.tokenA.name} / {pool.tokenB.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                {/* USDT Liquidity Information */}
                <div className="bg-secondary/30 rounded-lg p-2 flex items-center justify-between">
                  <div className="flex items-center text-xs">
                    <DollarSign className="h-3 w-3 ml-1 text-primary" />
                    <span>نقدینگی USDT:</span>
                  </div>
                  <div className="text-xs font-medium" dir="ltr">
                    {pool.hasUsdt ? (
                      `${formatNumberWithSuffix(pool.usdtLiquidity || "0")} USDT`
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3 ml-1" />
                  <span title={formatTimestamp(pool.timestamp)}>{getTimeAgo(pool.timestamp)}</span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <a
                    href={`https://zanjir.xyz/explorer/address/${pool.poolAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary hover:underline flex items-center"
                  >
                    مشاهده استخر
                    <ExternalLink className="h-2.5 w-2.5 mr-0.5" />
                  </a>
                  <Link
                    href={(() => {
                      // Get priority of each token (default to -1 if not in the list)
                      const priorityA = TOKEN_PRIORITY[pool.tokenA.symbol] ?? -1
                      const priorityB = TOKEN_PRIORITY[pool.tokenB.symbol] ?? -1

                      // Return the token with lower priority
                      return priorityA < priorityB ? `/swap/${pool.tokenA.address}` : `/swap/${pool.tokenB.address}`
                    })()}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2 py-0"
                      disabled={!connected || !isCorrectNetwork}
                    >
                      مبادله
                      <ArrowRight className="h-3 w-3 mr-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

