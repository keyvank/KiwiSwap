"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  checkPoolExists,
  getPoolInfo,
  calculateOutputAmount,
  calculateMinimumOutputWithSlippage,
  addLiquidity,
  swapAForB,
  swapBForA,
  getTokenBalance,
  getPendingRewards,
  claimRewards,
  getUserLPTokens,
} from "@/lib/contract-utils"

interface UsePoolProps {
  connected: boolean
  account: string
  isCorrectNetwork: boolean
  tokenAAddress: string
  tokenBAddress: string
}

export function usePool({ connected, account, isCorrectNetwork, tokenAAddress, tokenBAddress }: UsePoolProps) {
  const [poolExists, setPoolExists] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [reservoirA, setReservoirA] = useState("0")
  const [reservoirB, setReservoirB] = useState("0")
  const [exchangeRate, setExchangeRate] = useState("0")
  const [balanceA, setBalanceA] = useState("0")
  const [balanceB, setBalanceB] = useState("0")
  const [pendingRewards, setPendingRewards] = useState("0")
  const [lpTokens, setLpTokens] = useState("0")
  const { toast } = useToast()

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

  // دریافت اطلاعات استخر و موجودی‌ها
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

        // دریافت پاداش‌های قابل برداشت
        if (account) {
          const rewards = await getPendingRewards(firstToken, secondToken, account)
          setPendingRewards(rewards)

          // دریافت تعداد توکن‌های LP
          const userLPTokens = await getUserLPTokens(firstToken, secondToken, account)
          setLpTokens(userLPTokens)
        }
      } else {
        setReservoirA("0")
        setReservoirB("0")
        setExchangeRate("0")
        setPendingRewards("0")
        setLpTokens("0")
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
    (amountIn: string, isAToB: boolean, slippagePercentage: string) => {
      if (!poolExists || !amountIn || Number.parseFloat(amountIn) <= 0) {
        return { outputAmount: "0", minAmountOut: "0" }
      }

      let outputAmount
      if (isAToB) {
        outputAmount = calculateOutputAmount(amountIn, reservoirA, reservoirB)
      } else {
        outputAmount = calculateOutputAmount(amountIn, reservoirB, reservoirA)
      }

      const minAmountOut = calculateMinimumOutputWithSlippage(outputAmount, slippagePercentage)

      return { outputAmount, minAmountOut }
    },
    [poolExists, reservoirA, reservoirB],
  )

  // تابع برای انجام مبادله
  const handleSwap = useCallback(
    async (amountIn: string, minAmountOut: string, isAToB: boolean, onSuccess?: () => void) => {
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
          await swapAForB(firstToken, secondToken, amountIn, minAmountOut)
        } else {
          await swapBForA(firstToken, secondToken, amountIn, minAmountOut)
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

  // تابع برای برداشت پاداش
  const handleClaimRewards = useCallback(async () => {
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

    try {
      const { firstToken, secondToken } = getSortedTokenAddresses()

      await claimRewards(firstToken, secondToken)

      toast({
        title: "تراکنش موفق",
        description: "پاداش‌ها با موفقیت برداشت شدند.",
      })

      // به‌روزرسانی موجودی‌ها و اطلاعات استخر
      fetchPoolAndBalances()
      return true
    } catch (error) {
      console.error("خطا در برداشت پاداش:", error)
      toast({
        title: "خطا",
        description: "خطا در برداشت پاداش. لطفا دوباره تلاش کنید.",
        variant: "destructive",
      })
      return false
    }
  }, [connected, isCorrectNetwork, poolExists, getSortedTokenAddresses, fetchPoolAndBalances, toast])

  return {
    poolExists,
    isLoading,
    reservoirA,
    reservoirB,
    exchangeRate,
    balanceA,
    balanceB,
    pendingRewards,
    lpTokens,
    calculateOutput,
    swap: handleSwap,
    addLiquidity: handleAddLiquidity,
    claimRewards: handleClaimRewards,
    refreshPool: fetchPoolAndBalances,
  }
}

