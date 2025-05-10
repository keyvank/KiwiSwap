"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Wallet, LogOut, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useWallet } from "@/contexts/wallet-context"
import { useNetwork } from "@/contexts/network-context"
import { switchToZanjirNetwork } from "@/lib/contract-utils"

interface ConnectWalletProps {
  connected?: boolean
  account?: string
  onConnect?: () => void
  onDisconnect?: () => void
}

export function ConnectWallet({ onConnect, onDisconnect }: ConnectWalletProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const { connected, account, connect, disconnect } = useWallet()
  const { networkType } = useNetwork()

  const handleConnect = async () => {
    if (connected) return

    setIsConnecting(true)
    try {
      // First, check if the desired network exists and add it if needed
      try {
        // This will add the network if it doesn't exist
        await switchToZanjirNetwork()
      } catch (networkError) {
        console.error("خطا در تنظیم شبکه:", networkError)
        // Continue with connection attempt even if network switch fails
      }

      // Now request wallet connection (this will prompt for consent)
      await connect()

      if (onConnect) onConnect()
    } catch (error) {
      console.error("خطا در اتصال به کیف پول:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      if (onDisconnect) onDisconnect()
    } catch (error) {
      console.error("خطا در قطع اتصال کیف پول:", error)
    }
  }

  // نمایش آدرس کوتاه شده کیف پول
  const shortenAddress = (address: string) => {
    if (!address) return ""
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  if (!connected) {
    return (
      <Button
        variant="default"
        size="sm"
        onClick={handleConnect}
        disabled={isConnecting}
        className="flex items-center gap-1"
      >
        {isConnecting ? (
          <>
            <Loader2 className="h-4 w-4 ml-1 animate-spin" />
            در حال اتصال...
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4 ml-1" />
            اتصال کیف پول
          </>
        )}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Wallet className="h-4 w-4 ml-1" />
          {account ? shortenAddress(account) : "متصل"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-destructive">
          <LogOut className="h-4 w-4 ml-2" />
          قطع اتصال
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
