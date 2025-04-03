"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  checkPoolExists,
  calculateMinimumOutputWithSlippage,
  addLiquidity,
  swapAForB,
  swapBForA,
  getTokenBalance,
  getUserLPTokens,
  connectToPool,
  connectToToken,
  sortTokenAddresses,
  getRemoveLiquidityPreview,
  removeLiquidity,
  estimateLPTokensToReceive,
  getExactOutputAmount,
  getSwapEvents,
  getTokenSymbol,
} from "@/lib/contract-utils"
import { ethers } from "ethers"

interface UsePoolProps {
  connected: boolean
  account: string
  isCorrectNetwork: boolean
  tokenAAddress: string
  tokenBAddress: string
  tokenBAddress: string
}

const getPoolInfo = async (tokenAAddress: string, tokenBAddress: string) => {
  try {
    // مرتب‌سازی آدرس‌ها
    const { tokenA, tokenB, swapped } = sortTokenAddresses(tokenAAddress, tokenBAddress)

    const poolExists = await checkPoolExists(tokenA, tokenB)

    if (!poolExists) {
      return {
        exists: false,
        reservoirA: "0",
        reservoirB: "0",
        exchangeRate: "0",
      }
    }

    const { contract: pool } = await connectToPool(tokenA, tokenB)

    const reservoirA = await pool.reserveA()
    const reservoirB = await pool.reserveB()

    const tokenAContract = await connectToToken(tokenA)
    const tokenBContract = await connectToToken(tokenB)

    const decimalsA = await tokenAContract.decimals()
    const decimalsB = await tokenBContract.decimals()

    // تشخیص نسخه ethers
    let reservoirAFormatted, reservoirBFormatted
    reservoirAFormatted = ethers.formatUnits(reservoirA, decimalsA)
    reservoirBFormatted = ethers.formatUnits(reservoirB, decimalsB)

    // دریافت نرخ تبادل با فرمت جدید (دو مقدار)
    const [rateAtoB, rateBtoA] = await pool.getExchangeRate()

    // محاسبه نرخ تبادل
    let exchangeRate = "0"
    exchangeRate = ethers.formatUnits(rateAtoB, 18)

    return {
      exists: true,
      reservoirA: reservoirAFormatted,
      reservoirB: reservoirBFormatted,
      exchangeRate,
      swapped,
    }
  } catch (error) {
    console.error("خطا در دریافت اطلاعات استخر:", error)
    return {
      exists: false,
      reservoirA: "0",
      reservoirB: "0",
      exchangeRate: "0",
      swapped: false,
    }
  }
}

// Function to format a number with a maximum of 6 decimal places
const formatNumber = (number: bigint) => {
  const formatted = ethers.formatEther(number)
  const parts = formatted.split(".")
  if (parts.length > 1) {
    return parts[0] + "." + parts[1].substring(0, 6)
  }
  return formatted
}

export function usePool({ connected, account, isCorrectNetwork, tokenAAddress, tokenBAddress }: UsePoolProps) {
  const [poolExists, setPoolExists] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [reservoirA, setReservoirA] = useState("0")
  const [reservoirB, setReservoirB] = useState("0")
  const [exchangeRate, setExchangeRate] = useState("0")
  const [balanceA, setBalanceA] = useState("0")
  const [balanceB, setBalanceB] = useState("0")
  const [lpTokens, setLpTokens] = useState("0")
  const { toast } = useToast()
  // Add totalLpSupply to the state
  const [totalLpSupply, setTotalLpSupply] = useState("0")

  // تابع برای مرتب‌سازی آدرس‌های توکن به صورت صعودی
  const getSortedTokenAddresses = useCallback(() => {
    // تبدیل آدرس‌ها به حروف کوچک برای مقایسه یکسان
    const addressA = tokenAAddress.toLowerCase()
    const addressB = tokenBAddress.toLowerCase()

    // بررسی اینکه آیا آدرس‌ها در ترتیب صعودی هستند یا خیر
    const isOriginalOrder = addressA < addressB

    // آدرس‌های مرتب شده
    const [firstToken, secondToken] = isOriginalOrder ? [tokenAAddress, tokenBAddress] : [tokenBAddress, tokenAAddress]

    return {
      firstToken,
      secondToken,
      isOriginalOrder,
    }
  }, [tokenAAddress, tokenBAddress])

  // Update the fetchPoolAndBalances function to fetch the totalSupply
  const fetchPoolAndBalances = useCallback(async () => {
    if (!connected || !tokenAAddress || !tokenBAddress || !isCorrectNetwork || !account) return

    setIsLoading(true)
    try {
      const { firstToken, secondToken, isOriginalOrder } = getSortedTokenAddresses()

      // بررسی وجود استخر با آدرس‌های مرتب شده
      const exists = await checkPoolExists(firstToken, secondToken)
      setPoolExists(exists)

      // دریافت اطلاعات استخر
      if (exists) {
        const poolInfo = await getPoolInfo(firstToken, secondToken)

        // تنظیم مقادیر با توجه به ترتیب اصلی توکن‌ها در رابط کاربری
        if (isOriginalOrder) {
          setReservoirA(poolInfo.reservoirA)
          setReservoirB(poolInfo.reservoirB)
          setExchangeRate(poolInfo.exchangeRate)
        } else {
          // اگر ترتیب عوض شده، مقادیر را نیز عوض می‌کنیم
          setReservoirA(poolInfo.reservoirB)
          setReservoirB(poolInfo.reservoirA)
          // نرخ تبادل معکوس می‌شود
          const reverseRate =
            Number.parseFloat(poolInfo.exchangeRate) > 0
              ? (1 / Number.parseFloat(poolInfo.exchangeRate)).toString()
              : "0"
          setExchangeRate(reverseRate)
        }

        // دریافت تعداد توکن‌های LP
        if (account) {
          const userLPTokens = await getUserLPTokens(firstToken, secondToken, account)
          setLpTokens(userLPTokens)

          // دریافت کل توکن‌های LP
          const { contract: pool } = await connectToPool(firstToken, secondToken)
          const totalSupply = await pool.totalSupply()

          // تبدیل به فرمت خوانا
          let totalSupplyFormatted
          totalSupplyFormatted = ethers.formatEther(totalSupply)

          setTotalLpSupply(totalSupplyFormatted)
        }
      } else {
        setReservoirA("0")
        setReservoirB("0")
        setExchangeRate("0")
        setLpTokens("0")
        setTotalLpSupply("0")
      }

      // دریافت موجودی‌ها
      if (account) {
        const balA = await getTokenBalance(tokenAAddress, account)
        const balB = await getTokenBalance(tokenBAddress, account)
        setBalanceA(balA)
        setBalanceB(balB)
      }
    } catch (error) {
      console.error("خطا در دریافت اطلاعات استخر و موجودی‌ها:", error)
      toast({
        title: "خطا",
        description: "خطا در دریافت اطلاعات. لطفا دوباره تلاش کنید.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [connected, account, tokenAAddress, tokenBAddress, isCorrectNetwork, toast, getSortedTokenAddresses])

  // بارگذاری اطلاعات هنگام تغییر توکن‌ها یا اتصال
  useEffect(() => {
    if (connected && account) {
      fetchPoolAndBalances()
    }
  }, [connected, account, tokenAAddress, tokenBAddress, isCorrectNetwork, fetchPoolAndBalances])

  // محاسبه مقدار خروجی بر اساس مقدار ورودی
  const calculateOutput = useCallback(
    async (amountIn: string, isAToB: boolean, slippagePercentage: string) => {
      if (!poolExists || !amountIn || Number.parseFloat(amountIn) <= 0) {
        return { outputAmount: "0", minAmountOut: "0", isLoading: false }
      }

      try {
        // Get the output token address
        const outputTokenAddress = isAToB ? tokenBAddress : tokenAAddress

        // Get the token decimals
        // const decimals = await getTokenDecimals(outputTokenAddress)

        // Get exact output from contract
        const exactOutput = await getExactOutputAmount(tokenAAddress, tokenBAddress, amountIn, isAToB)

        if (exactOutput !== null) {
          // Calculate minimum amount with slippage while preserving decimals
          const minAmountOut = calculateMinimumOutputWithSlippage(exactOutput, slippagePercentage)
          return { outputAmount: exactOutput, minAmountOut, isLoading: false }
        } else {
          console.error("خطا در دریافت مقدار دقیق از قرارداد")
          return { outputAmount: "0", minAmountOut: "0", isLoading: false }
        }
      } catch (error) {
        console.error("خطا در محاسبه مقدار خروجی:", error)
        return { outputAmount: "0", minAmountOut: "0", isLoading: false }
      }
    },
    [poolExists, tokenAAddress, tokenBAddress],
  )

  // تابع برای انجام مبادله
  const handleSwap = useCallback(
    async (
      amountIn: string,
      minAmountOut: string,
      isAToB: boolean,
      onSuccess?: () => void,
      onStatusUpdate?: (status: "approving" | "swapping" | "completed" | "error") => void,
    ) => {
      if (!connected) {
        toast({
          title: "خطا",
          description: "لطفا ابتدا کیف پول خود را متصل کنید.",
          variant: "destructive",
        })
        return false
      }

      if (!isCorrectNetwork) {
        toast({
          title: "خطا",
          description: "لطفا به شبکه Zanjir متصل شوید.",
          variant: "destructive",
        })
        return false
      }

      if (!amountIn || !minAmountOut) {
        toast({
          title: "خطا",
          description: "لطفا مقادیر را وارد کنید.",
          variant: "destructive",
        })
        return false
      }

      if (!poolExists) {
        toast({
          title: "خطا",
          description: "استخر برای این جفت توکن وجود ندارد. لطفا ابتدا نقدینگی اضافه کنید.",
          variant: "destructive",
        })
        return false
      }

      try {
        const { firstToken, secondToken, isOriginalOrder } = getSortedTokenAddresses()

        // تعیین تابع مبادله با توجه به ترتیب توکن‌ها و جهت مبادله
        // اگر ترتیب اصلی باشد و جهت A به B باشد، از swapAForB استفاده می‌کنیم
        // اگر ترتیب اصلی باشد و جهت B به A باشد، از swapBForA استفاده می‌کنیم
        // اگر ترتیب عوض شده باشد، این منطق معکوس می‌شود

        if ((isOriginalOrder && isAToB) || (!isOriginalOrder && !isAToB)) {
          await swapAForB(firstToken, secondToken, amountIn, minAmountOut, onStatusUpdate)
        } else {
          await swapBForA(firstToken, secondToken, amountIn, minAmountOut, onStatusUpdate)
        }

        toast({
          title: "تراکنش موفق",
          description: "مبادله با موفقیت انجام شد.",
        })

        if (onSuccess && typeof onSuccess === "function") {
          onSuccess()
        }

        // به‌روزرسانی موجودی‌ها و اطلاعات استخر
        fetchPoolAndBalances()
        return true
      } catch (error) {
        console.error("خطا در مبادله:", error)
        toast({
          title: "خطا",
          description: "خطا در انجام مبادله. لطفا دوباره تلاش کنید.",
          variant: "destructive",
        })
        return false
      }
    },
    [connected, isCorrectNetwork, poolExists, getSortedTokenAddresses, fetchPoolAndBalances, toast],
  )

  // تابع برای افزودن نقدینگی
  const handleAddLiquidity = useCallback(
    async (amountA: string, amountB: string, onSuccess?: () => void) => {
      if (!connected) {
        toast({
          title: "خطا",
          description: "لطفا ابتدا کیف پول خود را متصل کنید.",
          variant: "destructive",
        })
        return false
      }

      if (!isCorrectNetwork) {
        toast({
          title: "خطا",
          description: "لطفا به شبکه Zanjir متصل شوید.",
          variant: "destructive",
        })
        return false
      }

      if (!amountA || !amountB) {
        toast({
          title: "خطا",
          description: "لطفا مقادیر را وارد کنید.",
          variant: "destructive",
        })
        return false
      }

      try {
        const { firstToken, secondToken, isOriginalOrder } = getSortedTokenAddresses()

        // مقادیر را با توجه به ترتیب توکن‌ها تنظیم می‌کنیم
        const [firstAmount, secondAmount] = isOriginalOrder ? [amountA, amountB] : [amountB, amountA]

        await addLiquidity(firstToken, secondToken, firstAmount, secondAmount)

        toast({
          title: "تراکنش موفق",
          description: "نقدینگی با موفقیت اضافه شد.",
        })

        if (onSuccess && typeof onSuccess === "function") {
          onSuccess()
        }

        // به‌روزرسانی موجودی‌ها و اطلاعات استخر
        fetchPoolAndBalances()
        return true
      } catch (error) {
        console.error("خطا در افزودن نقدینگی:", error)
        toast({
          title: "خطا",
          description: "خطا در افزودن نقدینگی. لطفا دوباره تلاش کنید.",
          variant: "destructive",
        })
        return false
      }
    },
    [connected, isCorrectNetwork, getSortedTokenAddresses, fetchPoolAndBalances, toast],
  )

  // تابع برای برداشت نقدینگی
  const handleRemoveLiquidity = useCallback(
    async (liquidity: string, onSuccess?: () => void) => {
      if (!connected) {
        toast({
          title: "خطا",
          description: "لطفا ابتدا کیف پول خود را متصل کنید.",
          variant: "destructive",
        })
        return false
      }

      if (!isCorrectNetwork) {
        toast({
          title: "خطا",
          description: "لطفا به شبکه Zanjir متصل شوید.",
          variant: "destructive",
        })
        return false
      }

      if (!poolExists) {
        toast({
          title: "خطا",
          description: "استخر برای این جفت توکن وجود ندارد.",
          variant: "destructive",
        })
        return false
      }

      if (!liquidity || Number(liquidity) <= 0) {
        toast({
          title: "خطا",
          description: "لطفا مقدار معتبری وارد کنید.",
          variant: "destructive",
        })
        return false
      }

      if (Number(liquidity) > Number(lpTokens)) {
        toast({
          title: "خطا",
          description: "مقدار وارد شده بیشتر از موجودی شما است.",
          variant: "destructive",
        })
        return false
      }

      try {
        const { firstToken, secondToken } = getSortedTokenAddresses()

        await removeLiquidity(firstToken, secondToken, liquidity)

        toast({
          title: "تراکنش موفق",
          description: "نقدینگی با موفقیت برداشت شد.",
        })

        if (onSuccess && typeof onSuccess === "function") {
          onSuccess()
        }

        // به‌روزرسانی موجودی‌ها و اطلاعات استخر
        fetchPoolAndBalances()
        return true
      } catch (error) {
        console.error("خطا در برداشت نقدینگی:", error)
        toast({
          title: "خطا",
          description: "خطا در برداشت نقدینگی. لطفا دوباره تلاش کنید.",
          variant: "destructive",
        })
        return false
      }
    },
    [connected, isCorrectNetwork, poolExists, lpTokens, getSortedTokenAddresses, fetchPoolAndBalances, toast],
  )

  // Add the getRemoveLiquidityPreview function to the usePool hook
  const fetchRemoveLiquidityPreview = useCallback(
    async (liquidityAmount: string) => {
      if (!connected || !tokenAAddress || !tokenBAddress || !isCorrectNetwork || !account || !poolExists) {
        return { amountA: "0", amountB: "0" }
      }

      try {
        const { firstToken, secondToken, isOriginalOrder } = getSortedTokenAddresses()
        const preview = await getRemoveLiquidityPreview(firstToken, secondToken, liquidityAmount)

        // تنظیم مقادیر با توجه به ترتیب اصلی توکن‌ها در رابط کاربری
        if (isOriginalOrder) {
          return preview
        } else {
          // اگر ترتیب عوض شده، مقادیر را نیز عوض می‌کنیم
          return { amountA: preview.amountB, amountB: preview.amountA }
        }
      } catch (error) {
        console.error("خطا در دریافت پیش‌بینی برداشت نقدینگی:", error)
        return { amountA: "0", amountB: "0" }
      }
    },
    [connected, account, tokenAAddress, tokenBAddress, isCorrectNetwork, poolExists, getSortedTokenAddresses],
  )

  // Add this function to the usePool hook
  const estimateLPTokens = useCallback(
    async (amountA: string, amountB: string) => {
      if (!connected || !tokenAAddress || !tokenBAddress || !isCorrectNetwork || !account) {
        return "0"
      }

      if (!amountA || !amountB || Number.parseFloat(amountA) <= 0 || Number.parseFloat(amountB) <= 0) {
        return "0"
      }

      try {
        const { firstToken, secondToken, isOriginalOrder } = getSortedTokenAddresses()

        // مقادیر را با توجه به ترتیب توکن‌ها تنظیم می‌کنیم
        const [firstAmount, secondAmount] = isOriginalOrder ? [amountA, amountB] : [amountB, amountA]

        const estimatedLPTokens = await estimateLPTokensToReceive(firstToken, secondToken, firstAmount, secondAmount)
        return estimatedLPTokens
      } catch (error) {
        console.error("خطا در تخمین تعداد توکن‌های LP:", error)
        return "0"
      }
    },
    [connected, account, tokenAAddress, tokenBAddress, isCorrectNetwork, getSortedTokenAddresses],
  )

  // Add totalLpSupply to the return object
  return {
    poolExists,
    isLoading,
    reservoirA,
    reservoirB,
    exchangeRate,
    balanceA,
    balanceB,
    lpTokens,
    totalLpSupply,
    calculateOutput,
    swap: handleSwap,
    addLiquidity: handleAddLiquidity,
    removeLiquidity: handleRemoveLiquidity,
    refreshPool: fetchPoolAndBalances,
    getRemoveLiquidityPreview: fetchRemoveLiquidityPreview,
    estimateLPTokens,
    getSwapEvents: async () => {
      try {
        if (!poolExists) return []

        const { firstToken, secondToken, isOriginalOrder } = getSortedTokenAddresses()
        const events = await getSwapEvents(firstToken, secondToken)

        // Get token symbols
        let symbolA, symbolB
        try {
          symbolA = await getTokenSymbol(tokenAAddress)
          symbolB = await getTokenSymbol(tokenBAddress)
        } catch (error) {
          console.error("Error fetching token symbols:", error)
          symbolA = tokenAAddress
          symbolB = tokenBAddress
        }

        // Transform events into a more usable format
        const formattedEvents = events.map((event, index) => {
          try {
            // Use the isAToB field from the event to determine direction
            // We need to account for whether tokens were swapped in sortTokenAddresses
            const eventIsAToB = event.args?.isAToB !== undefined ? event.args.isAToB : true

            // Adjust for token order - if tokens were swapped in sorting, we need to invert the direction
            const effectiveIsAToB = isOriginalOrder ? eventIsAToB : !eventIsAToB

            // Now determine which token is input and which is output
            const tokenIn = effectiveIsAToB ? symbolA : symbolB
            const tokenOut = effectiveIsAToB ? symbolB : symbolA

            return {
              id: `${event.blockNumber || 0}-${index}`,
              user: event.args?.user || "",
              amountIn: event.args?.amountIn ? ethers.formatEther(event.args.amountIn) : "0",
              amountOut: event.args?.amountOut ? ethers.formatEther(event.args.amountOut) : "0",
              timestamp: event.blockTimestamp || Math.floor(Date.now() / 1000),
              tokenIn: tokenIn,
              tokenOut: tokenOut,
              txHash: event.transactionHash || "",
            }
          } catch (error) {
            console.error("Error formatting event:", error)
            return {
              id: `error-${index}`,
              user: "Unknown",
              amountIn: "0",
              amountOut: "0",
              timestamp: Math.floor(Date.now() / 1000),
              tokenIn: symbolA || tokenAAddress,
              tokenOut: symbolB || tokenBAddress,
              txHash: "", // Add empty transaction hash for error cases
            }
          }
        })

        // Return all events for chart data, but only show the most recent 5 in the history UI
        return formattedEvents
      } catch (error) {
        console.error("Error getting swap events:", error)
        return []
      }
    },
  }
}

