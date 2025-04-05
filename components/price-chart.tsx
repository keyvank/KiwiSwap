"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, TrendingUp } from "lucide-react"
import { TOKEN_PRIORITY } from "@/lib/token-priority"
import dynamic from "next/dynamic"

// Dynamically import ApexCharts with no SSR to avoid hydration issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface PriceChartProps {
  tokenA: string
  tokenB: string
  poolExists: boolean
  exchangeRate: string
  swapEvents?: Array<{
    id: string
    user: string
    amountIn: string
    amountOut: string
    timestamp: number
    tokenIn: string
    tokenOut: string
    txHash: string
  }>
  // Add a prop to receive the parent loading state
  isParentLoading?: boolean
}

interface CandleData {
  x: Date
  y: number[] // [open, high, low, close]
}

// Process swap events to hourly candlestick data
const processSwapEventsToChartData = (
  swapEvents: PriceChartProps["swapEvents"] = [],
  baseToken: string,
  quoteToken: string,
  currentExchangeRate: string,
): CandleData[] => {
  if (!swapEvents || swapEvents.length === 0) {
    // Return empty array instead of mock data
    return []
  }

  // Group events by hour
  const eventsByHour = new Map<string, Array<any>>()

  // Sort events by timestamp (oldest first)
  const sortedEvents = [...swapEvents].sort((a, b) => a.timestamp - b.timestamp)

  sortedEvents.forEach((event) => {
    const date = new Date(event.timestamp * 1000)
    // Create a key that includes year, month, day, and hour
    date.setMinutes(0, 0, 0) // Round to the start of the hour
    const hourKey = date.toISOString()

    if (!eventsByHour.has(hourKey)) {
      eventsByHour.set(hourKey, [])
    }

    // Calculate the exchange rate for this swap
    let rate: number
    if (event.tokenIn === baseToken && event.tokenOut === quoteToken) {
      // Base to Quote swap (e.g., USDT to IRT)
      rate = Number(event.amountOut) / Number(event.amountIn)
    } else if (event.tokenIn === quoteToken && event.tokenOut === baseToken) {
      // Quote to Base swap (e.g., IRT to USDT)
      rate = 1 / (Number(event.amountOut) / Number(event.amountIn))
    } else {
      // Skip events that don't match our token pair
      return
    }

    // Add the event with its calculated rate
    eventsByHour.get(hourKey)?.push({
      ...event,
      rate,
    })
  })

  // Convert grouped events to candle data
  const candleData: CandleData[] = []

  // Use the current rate as the starting point for hours with no data
  let lastClose = Number.parseFloat(currentExchangeRate) || 1

  // Get all hours in range
  const hours = Array.from(eventsByHour.keys()).sort()

  // Fill in missing hours if needed
  if (hours.length > 0) {
    const startDate = new Date(hours[0])
    const endDate = new Date()
    const hourRange: string[] = []

    // Generate all hours in range
    for (let d = new Date(startDate); d <= endDate; d.setHours(d.getHours() + 1)) {
      const hourDate = new Date(d)
      hourDate.setMinutes(0, 0, 0) // Ensure we're at the start of the hour
      hourRange.push(hourDate.toISOString())
    }

    // Process each hour
    hourRange.forEach((hourKey, index) => {
      const hourEvents = eventsByHour.get(hourKey) || []
      const date = new Date(hourKey)

      if (hourEvents.length === 0) {
        // No events for this hour, use the last close price for all values
        // This ensures continuity between candles
        candleData.push({
          x: date,
          y: [lastClose, lastClose, lastClose, lastClose],
        })
      } else {
        // Calculate OHLC from the hour's events
        const rates = hourEvents.map((e) => e.rate)

        // For the open price, use the last close price if this isn't the first candle
        // This ensures continuity between candles
        const open = index === 0 ? rates[0] : lastClose
        const close = rates[rates.length - 1]

        // For high and low, consider both the rates and the open price
        // This ensures the high/low includes the open price if it's the highest/lowest
        const high = Math.max(open, ...rates)
        const low = Math.min(open, ...rates)

        candleData.push({
          x: date,
          y: [
            Number.parseFloat(open.toFixed(6)),
            Number.parseFloat(high.toFixed(6)),
            Number.parseFloat(low.toFixed(6)),
            Number.parseFloat(close.toFixed(6)),
          ],
        })

        // Update last close for next hour
        lastClose = close
      }
    })
  }

  return candleData
}

export function PriceChart({
  tokenA,
  tokenB,
  poolExists,
  exchangeRate,
  swapEvents,
  isParentLoading = false,
}: PriceChartProps) {
  const [series, setSeries] = useState<any[]>([])
  const [options, setOptions] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [baseToken, setBaseToken] = useState<string>(tokenA)
  const [quoteToken, setQuoteToken] = useState<string>(tokenB)
  const [lastPrice, setLastPrice] = useState<number>(0)
  const [priceChange, setPriceChange] = useState<number>(0)
  const [priceChangePercentage, setPriceChangePercentage] = useState<number>(0)
  const [hasData, setHasData] = useState(false)

  // Update the useEffect to use the new function
  useEffect(() => {
    if (!poolExists) {
      setSeries([])
      setIsLoading(false)
      setHasData(false)
      return
    }

    setIsLoading(true)

    // Determine which token should be the base based on priority
    const priorityA = TOKEN_PRIORITY[tokenA] ?? -1
    const priorityB = TOKEN_PRIORITY[tokenB] ?? -1

    // Calculate the correct rate based on token priority
    let displayRate: number

    if (priorityA >= priorityB) {
      // If token A has higher priority, it should be the quote token
      // and token B should be the base token
      setBaseToken(tokenB)
      setQuoteToken(tokenA)

      // The exchange rate from the pool is tokenA/tokenB (how many B for 1 A)
      // We need to invert it to get tokenB/tokenA (how many A for 1 B)
      const poolRate = Number.parseFloat(exchangeRate)
      displayRate = poolRate > 0 ? 1 / poolRate : 0
    } else {
      // If token B has higher priority, it should be the quote token
      // and token A should be the base token
      setBaseToken(tokenA)
      setQuoteToken(tokenB)

      // The exchange rate from the pool is already in the format we need
      displayRate = Number.parseFloat(exchangeRate)
    }

    // Process swap events to generate chart data
    const chartData = processSwapEventsToChartData(
      swapEvents,
      priorityA >= priorityB ? tokenB : tokenA,
      priorityA >= priorityB ? tokenA : tokenB,
      displayRate.toString(),
    )

    // Check if we have any data
    setHasData(chartData.length > 0)

    // Calculate price change
    if (chartData.length > 0) {
      const firstPrice = chartData[0].y[3] // Close price of first candle
      const currentPrice = chartData[chartData.length - 1].y[3] // Close price of last candle
      setLastPrice(currentPrice)
      setPriceChange(currentPrice - firstPrice)
      setPriceChangePercentage(firstPrice !== 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0)
    } else {
      // No data, set defaults
      setLastPrice(displayRate)
      setPriceChange(0)
      setPriceChangePercentage(0)
    }

    // Set chart series
    setSeries([
      {
        name: `${baseToken}/${quoteToken}`,
        data: chartData,
      },
    ])

    // Configure chart options
    setOptions({
      chart: {
        type: "candlestick",
        height: 300,
        fontFamily: "var(--font-vazirmatn), sans-serif",
        toolbar: {
          show: true,
          tools: {
            download: false,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
          },
        },
        animations: {
          enabled: true,
        },
        background: "transparent",
      },
      theme: {
        mode: "dark",
      },
      xaxis: {
        type: "datetime",
        labels: {
          formatter: (val) => {
            const date = new Date(val)
            return `${date.toLocaleDateString("fa-IR")} ${date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}`
          },
          style: {
            fontSize: "10px",
          },
          datetimeUTC: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        opposite: true,
        tooltip: {
          enabled: true,
        },
        labels: {
          formatter: (val) => val.toFixed(6),
          style: {
            fontSize: "12px",
          },
        },
      },
      grid: {
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      plotOptions: {
        candlestick: {
          colors: {
            upward: "rgba(0, 200, 5, 0.8)",
            downward: "rgba(255, 80, 0, 0.8)",
          },
          wick: {
            useFillColor: true,
          },
        },
      },
      tooltip: {
        custom: ({ seriesIndex, dataPointIndex, w }) => {
          const o = w.globals.seriesCandleO[seriesIndex][dataPointIndex]
          const h = w.globals.seriesCandleH[seriesIndex][dataPointIndex]
          const l = w.globals.seriesCandleL[seriesIndex][dataPointIndex]
          const c = w.globals.seriesCandleC[seriesIndex][dataPointIndex]
          const date = new Date(w.globals.seriesX[seriesIndex][dataPointIndex])

          return `
            <div class="apexcharts-tooltip-candlestick" dir="rtl" style="padding: 8px; background: hsl(var(--background)); border: 1px solid hsl(var(--border)); border-radius: 4px;">
              <div style="margin-bottom: 4px; font-weight: bold;">
                ${date.toLocaleDateString("fa-IR")} ${date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span>باز شدن:</span>
                <span style="font-family: monospace;">${o.toFixed(6)} ${quoteToken}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span>بالاترین:</span>
                <span style="font-family: monospace;">${h.toFixed(6)} ${quoteToken}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span>پایین‌ترین:</span>
                <span style="font-family: monospace;">${l.toFixed(6)} ${quoteToken}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>بسته شدن:</span>
                <span style="font-family: monospace;">${c.toFixed(6)} ${quoteToken}</span>
              </div>
            </div>
          `
        },
      },
    })

    setIsLoading(false)
  }, [tokenA, tokenB, poolExists, exchangeRate, swapEvents])

  // Update the loading condition to skip rendering if parent is loading
  if (isParentLoading) {
    // Don't render anything if parent is handling the loading state
    return null
  }

  if (!poolExists) {
    return (
      <Card className="bg-secondary/50 border-dashed border-muted h-full">
        <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
          <div className="flex justify-center m-4">
            <TrendingUp className="h-12 w-12 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-lg font-medium mb-2">نمودار قیمت</h3>
          <p className="text-sm text-muted-foreground">
            برای این جفت توکن استخری وجود ندارد. پس از ایجاد استخر، نمودار قیمت نمایش داده خواهد شد.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Show loading state for both initial loading and when there's no data
  if (isLoading || !hasData) {
    return (
      <Card className="border-primary/20 h-full">
        <CardContent className="p-6 flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="mr-2">در حال بارگذاری نمودار...</span>
        </CardContent>
      </Card>
    )
  }

  const isPriceUp = priceChange >= 0

  return (
    <Card className="border-primary/20 h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4 p-6">
          <h3 className="text-lg font-medium">نمودار قیمت</h3>
          <div className="flex items-center gap-2">
            <span dir="ltr" className="font-mono text-sm">
              1 {baseToken} = {lastPrice.toFixed(6)} {quoteToken}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                isPriceUp ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
              }`}
            >
              <span className="ml-1">{isPriceUp ? "+" : ""}</span>
              {priceChangePercentage.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="h-[300px] w-full">
          {typeof window !== "undefined" && <Chart options={options} series={series} type="candlestick" height={300} />}
        </div>

        <div className="text-xs text-muted-foreground text-center mt-4">
          نمودار قیمت بر اساس مبادلات ساعتی نمایش داده می‌شود.
        </div>
      </CardContent>
    </Card>
  )
}

