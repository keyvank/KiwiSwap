"use client"

import Link from "next/link"
import { ConnectWallet } from "@/components/connect-wallet"
import { useWallet } from "@/hooks/use-wallet"
import { NetworkWarning } from "@/components/network-warning"
import { Store, Info, Sparkles, ArrowLeftRight } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  const { connected, account, isCorrectNetwork, connect, disconnect, switchNetwork } = useWallet()

  return (
    <header className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-8">
          <Link href="/" className="flex items-center space-x-2 space-x-reverse">
            <span className="text-xl font-bold">🥝 کیوی‌سواپ</span>
          </Link>
          <nav className="flex items-center gap-4 md:gap-6">
            <Link href="/" className="flex items-center text-sm font-medium transition-colors hover:text-primary">
              <ArrowLeftRight className="ml-1 h-4 w-4" />
              مبادله
            </Link>
            <Link
              href="/marketplace"
              className="flex items-center text-sm font-medium transition-colors hover:text-primary"
            >
              <Store className="ml-1 h-4 w-4" />
              بازارچه
            </Link>
            <Link
              href="/create-token"
              className="flex items-center text-sm font-medium transition-colors hover:text-primary"
            >
              <Sparkles className="ml-1 h-4 w-4" />
              توکنت رو بساز!
            </Link>
            <Link href="/about" className="flex items-center text-sm font-medium transition-colors hover:text-primary">
              <Info className="ml-1 h-4 w-4" />
              درباره ما
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {connected && !isCorrectNetwork && <NetworkWarning onSwitchNetwork={switchNetwork} />}
          <ThemeToggle />
          <ConnectWallet connected={connected} account={account} onConnect={connect} onDisconnect={disconnect} />
        </div>
      </div>
    </header>
  )
}

