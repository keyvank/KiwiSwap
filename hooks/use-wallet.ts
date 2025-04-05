"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  connectWallet,
  checkZanjirNetwork,
  switchToZanjirNetwork,
  checkWalletConnection,
  disconnectWallet,
} from "@/lib/contract-utils"

export function useWallet() {
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState("")
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()

  // تابع برای پاک کردن داده‌های کاربر هنگام قطع اتصال
  const resetUserData = useCallback(() => {
    setAccount("")
    setConnected(false)
  }, [])

  // بررسی اتصال کیف پول و شبکه
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          // بررسی وضعیت اتصال کیف پول
          const { connected: isConnected, account: currentAccount } = await checkWalletConnection()
          setConnected(isConnected)
          setAccount(currentAccount || "")

          // بررسی اتصال به شبکه Zanjir
          const isZanjirNetwork = await checkZanjirNetwork()
          setIsCorrectNetwork(isZanjirNetwork)

          // گوش دادن به تغییرات حساب
          const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length > 0) {
              setConnected(true)
              setAccount(accounts[0])
            } else {
              // کاربر قطع اتصال کرده است
              resetUserData()
            }
          }

          // گوش دادن به تغییرات شبکه
          const handleChainChanged = async () => {
            const isZanjir = await checkZanjirNetwork()
            setIsCorrectNetwork(isZanjir)
          }

          // حذف event listeners قبلی برای جلوگیری از تکرار
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
          window.ethereum.removeListener("chainChanged", handleChainChanged)

          // اضافه کردن event listeners جدید
          window.ethereum.on("accountsChanged", handleAccountsChanged)
          window.ethereum.on("chainChanged", handleChainChanged)

          // پاکسازی event listeners هنگام unmount
          return () => {
            if (window.ethereum) {
              window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
              window.ethereum.removeListener("chainChanged", handleChainChanged)
            }
          }
        } catch (error) {
          console.error("خطا در بررسی اتصال کیف پول:", error)
        }
      }
    }

    checkConnection()
  }, [resetUserData])

  const handleConnect = async () => {
    if (connected) return

    setIsConnecting(true)
    try {
      // بررسی اتصال به شبکه Zanjir
      const isZanjirNetwork = await checkZanjirNetwork()

      if (!isZanjirNetwork) {
        // تلاش برای تغییر به شبکه Zanjir
        await switchToZanjirNetwork()
      }

      // اتصال به کیف پول
      const account = await connectWallet()
      setConnected(true)
      setAccount(account)
      setIsCorrectNetwork(true)

      toast({
        title: "کیف پول متصل شد",
        description: "شما با موفقیت به شبکه Zanjir متصل شدید.",
      })

      return account
    } catch (error) {
      console.error("خطا در اتصال به کیف پول:", error)
      toast({
        title: "خطا",
        description: "خطا در اتصال به کیف پول یا تغییر شبکه. لطفا دوباره تلاش کنید.",
        variant: "destructive",
      })
      return null
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnectWallet()
      resetUserData()
      toast({
        title: "قطع اتصال",
        description: "اتصال کیف پول با موفقیت قطع شد.",
      })
    } catch (error) {
      console.error("خطا در قطع اتصال کیف پول:", error)
    }
  }

  const handleSwitchNetwork = async () => {
    try {
      await switchToZanjirNetwork()
      setIsCorrectNetwork(true)
      return true
    } catch (error) {
      console.error("خطا در تغییر شبکه:", error)
      return false
    }
  }

  // Make sure the return statement includes isConnecting
  return {
    connected,
    account,
    isCorrectNetwork,
    isConnecting,
    connect: handleConnect,
    disconnect: handleDisconnect,
    switchNetwork: handleSwitchNetwork,
  }
}

