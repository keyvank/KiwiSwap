"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Wallet, LogOut } from "lucide-react"
import { connectWallet, checkZanjirNetwork, switchToZanjirNetwork, disconnectWallet } from "@/lib/contract-utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ConnectWalletProps {
  connected: boolean
  account?: string
  onConnect: () => void
  onDisconnect: () => void
}

export function ConnectWallet({ connected, account, onConnect, onDisconnect }: ConnectWalletProps) {
  const [isConnecting, setIsConnecting] = useState(false)

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
      await connectWallet()
      onConnect()
    } catch (error) {
      console.error("خطا در اتصال به کیف پول:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnectWallet()
      onDisconnect()
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
        <Wallet className="h-4 w-4 ml-1" />
        {isConnecting ? "در حال اتصال..." : "اتصال کیف پول"}
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

