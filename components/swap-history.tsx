"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Loader2, RefreshCw, Clock, ArrowLeft, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/utils"

interface SwapEvent {
  id: string
  user: string
  amountIn: string
  amountOut: string
  timestamp: number
  tokenIn: string
  tokenOut: string
  txHash: string
}

interface SwapHistoryProps {
  tokenA: string
  tokenB: string
  tokenAAddress: string
  tokenBAddress: string
  poolExists: boolean
  getSwapEvents: () => Promise<SwapEvent[]>
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

export function SwapHistory({
  tokenA,
  tokenB,
  tokenAAddress,
  tokenBAddress,
  poolExists,
  getSwapEvents,
  disabled,
  account,
}: SwapHistoryProps) {
  const [events, setEvents] = useState<SwapEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Add a loading state for token symbols
  const [isLoadingSymbols, setIsLoadingSymbols] = useState(false)

  // Function to fetch swap events
  const fetchSwapEvents = async () => {
    if (!poolExists || disabled) {
      setEvents([])
      return
    }

    setIsLoading(true)
    setIsLoadingSymbols(true)
    setError(null)

    try {
      const swapEvents = await getSwapEvents()

      // Check if we got valid events
      if (Array.isArray(swapEvents)) {
        // Reverse the array to show newest first and limit to 5 items
        setEvents(swapEvents.reverse().slice(0, 5))
      } else {
        console.error("Invalid events data:", swapEvents)
        setError("دریافت داده‌های نامعتبر. لطفا دوباره تلاش کنید.")
        setEvents([])
      }
    } catch (error) {
      console.error("Error fetching swap events:", error)
      setError("خطا در دریافت تاریخچه مبادلات. لطفا دوباره تلاش کنید.")
      setEvents([])
    } finally {
      setIsLoading(false)
      setIsLoadingSymbols(false)
    }
  }

  // Fetch events when the component mounts or when pool/tokens change
  useEffect(() => {
    const fetchEvents = async () => {
      if (!poolExists || disabled) {
        setEvents([])
        return
      }

      setIsLoading(true)
      setIsLoadingSymbols(true)
      setError(null)

      try {
        const swapEvents = await getSwapEvents()

        // Check if we got valid events
        if (Array.isArray(swapEvents)) {
          // Reverse the array to show newest first and limit to 5 items
          setEvents(swapEvents.reverse().slice(0, 5))
        } else {
          console.error("Invalid events data:", swapEvents)
          setError("دریافت داده‌های نامعتبر. لطفا دوباره تلاش کنید.")
          setEvents([])
        }
      } catch (error) {
        console.error("Error fetching swap events:", error)
        setError("خطا در دریافت تاریخچه مبادلات. لطفا دوباره تلاش کنید.")
        setEvents([])
      } finally {
        setIsLoading(false)
        setIsLoadingSymbols(false)
      }
    }

    fetchEvents()
  }, [poolExists, tokenAAddress, tokenBAddress, account])

  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return ""
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  // Format timestamp to local date/time
  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return ""
    const date = new Date(timestamp * 1000)
    return date.toLocaleString("fa-IR")
  }

  // Check if an address is the current user
  const isCurrentUser = (address: string) => {
    return address.toLowerCase() === account?.toLowerCase()
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">تاریخچه مبادلات</h3>
        <Button variant="outline" size="sm" onClick={fetchSwapEvents} disabled={isLoading || !poolExists || disabled}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <RefreshCw className="h-4 w-4 ml-2" />}
          بروزرسانی
        </Button>
      </div>

      {!poolExists ? (
        <Card className="p-6 text-center bg-secondary/50 border-dashed">
          <p className="text-muted-foreground">استخری برای این جفت توکن وجود ندارد.</p>
        </Card>
      ) : isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="mr-2">در حال بارگذاری تاریخچه...</span>
        </div>
      ) : error ? (
        <Card className="p-6 text-center bg-destructive/20 border-dashed">
          <p className="text-destructive">{error}</p>
        </Card>
      ) : events.length === 0 ? (
        <Card className="p-6 text-center bg-secondary/50 border-dashed">
          <p className="text-muted-foreground">هیچ مبادله‌ای برای این جفت توکن یافت نشد.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card
              key={event.id}
              className={`p-4 border ${isCurrentUser(event.user) ? "border-primary/30 bg-primary/5" : "border-border"}`}
            >
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <User className="h-4 w-4 ml-1 text-muted-foreground" />
                    {isCurrentUser(event.user) ? (
                      <span className="text-sm font-medium">شما</span>
                    ) : (
                      <a
                        href={`https://zanjir.xyz/explorer/address/${event.user}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:text-primary hover:underline flex items-center"
                      >
                        {formatAddress(event.user)}
                      </a>
                    )}
                    {isCurrentUser(event.user) && (
                      <span className="mr-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        تراکنش شما
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 ml-1" />
                    <span dir="ltr">{formatTimestamp(event.timestamp)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2 mt-2">
                  <div className="text-right">
                    <span className="text-sm font-medium" dir="ltr">
                      {formatNumber(event.amountIn)} {event.tokenIn}
                    </span>
                  </div>

                  <div className="flex justify-center">
                    <ArrowLeft className="h-4 w-4 text-primary" />
                  </div>

                  <div className="text-left">
                    <span className="text-sm font-medium" dir="ltr">
                      {formatNumber(event.amountOut)} {event.tokenOut}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground mt-1">
                    نرخ:{" "}
                    <span dir="ltr" className="font-mono">
                      {(() => {
                        // Get priority of each token (default to -1 if not in the list)
                        const priorityIn = TOKEN_PRIORITY[event.tokenIn] ?? -1
                        const priorityOut = TOKEN_PRIORITY[event.tokenOut] ?? -1

                        // If input token has higher or equal priority, show input as base
                        if (priorityIn >= priorityOut) {
                          return `1 ${event.tokenIn} = ${(Number(event.amountOut) / Number(event.amountIn)).toFixed(6)} ${event.tokenOut}`
                        }
                        // Otherwise show output as base
                        else {
                          return `1 ${event.tokenOut} = ${(Number(event.amountIn) / Number(event.amountOut)).toFixed(6)} ${event.tokenIn}`
                        }
                      })()}
                    </span>
                  </div>

                  {event.txHash && (
                    <a
                      href={`https://zanjir.xyz/explorer/tx/${event.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                      dir="ltr"
                    >
                      مشاهده تراکنش
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

