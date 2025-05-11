"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { checkZanjirNetwork, switchToZanjirNetwork, checkWalletConnection } from "@/lib/contract-utils"

interface WalletContextType {
  connected: boolean
  account: string
  isCorrectNetwork: boolean
  isConnecting: boolean
  connect: () => Promise<string | null>
  disconnect: () => Promise<void>
  switchNetwork: () => Promise<boolean>
  forceUpdateConnection: (account: string) => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
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

          // حذف event listeners قبلی برای جلوگری از تکرار
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

  // Update the handleConnect function to force reconnection
  const handleConnect = async () => {
    setIsConnecting(true)

    try {
      // Request connection to accounts - this will trigger the MetaMask prompt
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })

      if (accounts.length === 0) {
        throw new Error("No account selected")
      }

      setConnected(true)
      setAccount(accounts[0])

      // Check if connected to the correct network
      const isZanjirNetwork = await checkZanjirNetwork()
      setIsCorrectNetwork(isZanjirNetwork)

      toast({
        title: "کیف پول متصل شد",
        description: "شما با موفقیت به کیف پول متصل شدید.",
      })

      return accounts[0]
    } catch (error) {
      console.error("Error connecting to wallet:", error)
      toast({
        title: "خطا",
        description: "خطا در اتصال به کیف پول. لطفا دوباره تلاش کنید.",
        variant: "destructive",
      })
      return null
    } finally {
      setIsConnecting(false)
    }
  }

  // Update the handleDisconnect function to properly reset connection state
  const handleDisconnect = async () => {
    try {
      // MetaMask doesn't provide a direct disconnect method,
      // but we can reset our app's connection state
      resetUserData()

      // Clear any cached permissions by requesting accounts with empty array
      // This is a workaround to force MetaMask to prompt again next time
      if (window.ethereum && window.ethereum._metamask) {
        try {
          // This is an unofficial way to clear permissions, use with caution
          await window.ethereum.request({
            method: "wallet_revokePermissions",
            params: [{ eth_accounts: {} }],
          })
        } catch (e) {
          // Ignore errors from this experimental method
          console.log("Could not revoke permissions, will reset local state only")
        }
      }

      toast({
        title: "قطع اتصال",
        description: "اتصال کیف پول با موفقیت قطع شد.",
      })

      return true
    } catch (error) {
      console.error("Error disconnecting wallet:", error)
      return false
    }
  }

  const handleSwitchNetwork = async () => {
    try {
      // This will now use the current network configuration based on network type
      // and will add the chain if needed
      await switchToZanjirNetwork()

      // After successful network switch, update the state
      setIsCorrectNetwork(true)

      return true
    } catch (error) {
      console.error("خطا در تغییر شبکه:", error)
      return false
    }
  }

  const value = {
    connected,
    account,
    isCorrectNetwork,
    isConnecting,
    connect: handleConnect,
    disconnect: handleDisconnect,
    switchNetwork: handleSwitchNetwork,
    forceUpdateConnection: (account: string) => {
      setConnected(true)
      setAccount(account)
    },
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
