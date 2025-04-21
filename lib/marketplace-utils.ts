import { ethers } from "ethers"
import {
  POOL_MANAGER_ADDRESS,
  POOL_MANAGER_ABI,
  BASIC_POOL_ABI,
  getProvider,
  getTokenSymbol,
  getERC20Info,
  getSwapEvents,
} from "@/lib/contract-utils"
import { TOKEN_PRIORITY } from "@/lib/token-priority"

export interface PoolInfo {
  id: string
  tokenA: {
    address: string
    symbol: string
    name: string
  }
  tokenB: {
    address: string
    symbol: string
    name: string
  }
  poolAddress: string
  timestamp: number
  isNew: boolean
  reserveA?: string
  reserveB?: string
  totalValueLocked?: string
  quoteToken?: string
  usdtLiquidity?: string
  hasUsdt?: boolean
  priceChange?: {
    percentage: number
    isPositive: boolean
  }
}

// Function to fetch recently created pools
export async function getRecentlyCreatedPools(): Promise<PoolInfo[]> {
  try {
    const provider = getProvider()
    const poolManagerContract = new ethers.Contract(POOL_MANAGER_ADDRESS, POOL_MANAGER_ABI, provider)

    // Get the latest block number
    const latestBlock = await provider.getBlockNumber()

    // Use the magic query to get recent events
    const filter = poolManagerContract.filters.PoolCreated()
    const events = await poolManagerContract.queryFilter(filter, BigInt("987654321"), latestBlock)

    // Process events to get pool information
    const poolsInfo = await Promise.all(
      events.map(async (event, index) => {
        try {
          const block = await provider.getBlock(event.blockNumber)
          const timestamp = Number(block?.timestamp || 0)

          // Get token information
          const tokenAAddress = event.args?.[0] || ""
          const tokenBAddress = event.args?.[1] || ""
          const poolAddress = event.args?.[2] || ""

          // Get token symbols
          const tokenASymbol = await getTokenSymbol(tokenAAddress)
          const tokenBSymbol = await getTokenSymbol(tokenBAddress)

          // Get token names
          let tokenAName = tokenASymbol
          let tokenBName = tokenBSymbol

          try {
            const tokenAInfo = await getERC20Info(tokenAAddress)
            const tokenBInfo = await getERC20Info(tokenBAddress)
            tokenAName = tokenAInfo.name
            tokenBName = tokenBInfo.name
          } catch (error) {
            console.error("Error fetching token info:", error)
          }

          // Check if the pool was created in the last 24 hours
          const isNew = Date.now() / 1000 - timestamp < 86400 // 24 hours in seconds

          // Get pool reserves and calculate TVL
          let reserveA = "0"
          let reserveB = "0"
          let totalValueLocked = "0"
          let quoteToken = "USDT" // Default quote token
          let usdtLiquidity = "0"
          let hasUsdt = false
          let priceChange = null

          try {
            // Connect to the pool contract to get reserves
            const poolContract = new ethers.Contract(poolAddress, BASIC_POOL_ABI, provider)

            // Get reserves
            reserveA = ethers.formatEther(await poolContract.reserveA())
            reserveB = ethers.formatEther(await poolContract.reserveB())

            // Check if either token is USDT
            if (tokenASymbol === "USDT") {
              usdtLiquidity = reserveA
              hasUsdt = true
            } else if (tokenBSymbol === "USDT") {
              usdtLiquidity = reserveB
              hasUsdt = true
            }

            // Determine quote token based on priority
            const priorityA = TOKEN_PRIORITY[tokenASymbol] ?? -1
            const priorityB = TOKEN_PRIORITY[tokenBSymbol] ?? -1

            // Calculate TVL based on the quote token (higher priority token)
            if (priorityA >= priorityB) {
              quoteToken = tokenASymbol
              // If token A is the quote (e.g., USDT), then TVL = reserveA + (reserveB * rate)
              // For simplicity, we'll just use reserveA as an approximation
              totalValueLocked = reserveA
            } else {
              quoteToken = tokenBSymbol
              // If token B is the quote, then TVL = reserveB + (reserveA * rate)
              // For simplicity, we'll just use reserveB as an approximation
              totalValueLocked = reserveB
            }

            // If the quote token is neither USDT nor USDT, try to convert to one of them
            if (quoteToken !== "USDT" && quoteToken !== "USDT") {
              // Default to USDT as the display currency
              quoteToken = "USDT"
              // In a real implementation, we would convert to USDT or USDT using exchange rates
              // For now, we'll just use a placeholder value
              totalValueLocked = "N/A"
            }

            // Calculate price change
            try {
              priceChange = await calculatePriceChange(tokenAAddress, tokenBAddress)
            } catch (error) {
              console.error("Error calculating price change:", error)
            }
          } catch (error) {
            console.error("Error fetching pool reserves:", error)
          }

          return {
            id: `${event.blockNumber}-${index}`,
            tokenA: {
              address: tokenAAddress,
              symbol: tokenASymbol,
              name: tokenAName,
            },
            tokenB: {
              address: tokenBAddress,
              symbol: tokenBSymbol,
              name: tokenBName,
            },
            poolAddress,
            timestamp,
            isNew,
            reserveA,
            reserveB,
            totalValueLocked,
            quoteToken,
            usdtLiquidity,
            hasUsdt,
            priceChange,
          }
        } catch (error) {
          console.error("Error processing pool event:", error)
          return null
        }
      }),
    )

    // Filter out null values and sort by timestamp (newest first)
    return poolsInfo.filter((pool) => pool !== null).sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error("Error fetching recently created pools:", error)
    return []
  }
}

// Calculate price change based on swap events
export async function calculatePriceChange(tokenAAddress: string, tokenBAddress: string) {
  try {
    // Get swap events
    const events = await getSwapEvents(tokenAAddress, tokenBAddress)

    // If no events or just one event, return null
    if (!events || events.length < 2) {
      return null
    }

    // Sort events by timestamp (oldest first)
    const sortedEvents = [...events].sort((a, b) => a.blockTimestamp - b.blockTimestamp)

    // Get first and last events
    const firstEvent = sortedEvents[0]
    const lastEvent = sortedEvents[sortedEvents.length - 1]

    // Calculate price from first event
    let firstPrice
    if (firstEvent.args.isAToB) {
      // A to B swap
      firstPrice =
        Number(ethers.formatEther(firstEvent.args.amountOut)) / Number(ethers.formatEther(firstEvent.args.amountIn))
    } else {
      // B to A swap
      firstPrice =
        Number(ethers.formatEther(firstEvent.args.amountIn)) / Number(ethers.formatEther(firstEvent.args.amountOut))
    }

    // Calculate price from last event
    let lastPrice
    if (lastEvent.args.isAToB) {
      // A to B swap
      lastPrice =
        Number(ethers.formatEther(lastEvent.args.amountOut)) / Number(ethers.formatEther(lastEvent.args.amountIn))
    } else {
      // B to A swap
      lastPrice =
        Number(ethers.formatEther(lastEvent.args.amountIn)) / Number(ethers.formatEther(lastEvent.args.amountOut))
    }

    // Calculate price change percentage
    const priceChangePercentage = ((lastPrice - firstPrice) / firstPrice) * 100

    return {
      percentage: Math.abs(priceChangePercentage),
      isPositive: priceChangePercentage >= 0,
    }
  } catch (error) {
    console.error("Error calculating price change:", error)
    return null
  }
}

// Format number with commas for thousands separators
export function formatLargeNumber(num: string): string {
  if (num === "N/A") return num

  const value = Number.parseFloat(num)
  if (isNaN(value)) return "0"

  // Format with commas and limit to 2 decimal places
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

// Format number with k, m, b suffixes
export function formatNumberWithSuffix(num: string): string {
  if (num === "N/A") return num

  const value = Number.parseFloat(num)
  if (isNaN(value)) return "0"

  if (value === 0) return "0"

  const absValue = Math.abs(value)

  if (absValue >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(1) + "B"
  } else if (absValue >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + "M"
  } else if (absValue >= 1_000) {
    return (value / 1_000).toFixed(1) + "K"
  } else {
    return value.toFixed(1)
  }
}

