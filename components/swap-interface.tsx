"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { ConnectWallet } from "@/components/connect-wallet"
import { NetworkWarning } from "@/components/network-warning"
import { SwapForm } from "@/components/swap-form"
import { LiquidityForm } from "@/components/liquidity-form"
import { useWallet } from "@/hooks/use-wallet"
import { usePool } from "@/hooks/use-pool"
import { TOKEN_ADDRESSES } from "@/lib/contract-utils"
import { cn } from "@/lib/utils"

export function SwapInterface() {
  const [activeTab, setActiveTab] = useState("swap")
  const [tokenA, setTokenA] = useState("ETH")
  const [tokenB, setTokenB] = useState("USDT")
  const [tokenAAddress, setTokenAAddress] = useState(TOKEN_ADDRESSES.ETH)
  const [tokenBAddress, setTokenBAddress] = useState(TOKEN_ADDRESSES.USDT)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showPoolInfo, setShowPoolInfo] = useState(false)

  const { connected, account, isCorrectNetwork, connect, disconnect, switchNetwork } = useWallet()

  const {
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
    swap,
    addLiquidity,
    claimRewards,
  } = usePool({
    connected,
    account,
    isCorrectNetwork,
    tokenAAddress,
    tokenBAddress,
  })

  const handleTokenASelect = (token: string, address: string) => {
    setTokenA(token)
    setTokenAAddress(address)
  }

  const handleTokenBSelect = (token: string, address: string) => {
    setTokenB(token)
    setTokenBAddress(address)
  }

  // مدیریت تغییر تب و حالت گسترده
  const handleTabChange = (value: string) => {
    setActiveTab(value)

    // اگر به تب نقدینگی رفتیم، حالت گسترده را فعال کنیم
    if (value === "liquidity") {
      setTimeout(() => {
        setIsExpanded(true)
        setTimeout(() => {
          setShowPoolInfo(true)
        }, 300)
      }, 100)
    } else {
      // اگر به تب مبادله رفتیم، حالت گسترده را غیرفعال کنیم
      setShowPoolInfo(false)
      setTimeout(() => {
        setIsExpanded(false)
      }, 300)
    }
  }

  // تغییر حالت گسترده/فشرده
  const toggleExpand = () => {
    if (isExpanded) {
      setShowPoolInfo(false)
      setTimeout(() => {
        setIsExpanded(false)
      }, 300)
    } else {
      setIsExpanded(true)
      setTimeout(() => {
        setShowPoolInfo(true)
      }, 300)
    }
  }

  return (
    <div
      className={cn(
        "w-full transition-all duration-500 ease-in-out",
        activeTab === "liquidity" && isExpanded ? "md:max-w-4xl mx-auto" : "max-w-md mx-auto",
      )}
    >
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">کیوی‌سواپ</CardTitle>
            <ConnectWallet connected={connected} account={account} onConnect={connect} onDisconnect={disconnect} />
          </div>
          <CardDescription>مبادله بر بستر زنجیر</CardDescription>
          {connected && !isCorrectNetwork && <NetworkWarning onSwitchNetwork={switchNetwork} />}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="mr-2">در حال بارگذاری...</span>
            </div>
          ) : (
            <Tabs defaultValue="swap" value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="swap">مبادله</TabsTrigger>
                <TabsTrigger value="liquidity">نقدینگی</TabsTrigger>
              </TabsList>

              <TabsContent value="swap">
                <SwapForm
                  tokenA={tokenA}
                  tokenB={tokenB}
                  tokenAAddress={tokenAAddress}
                  tokenBAddress={tokenBAddress}
                  balanceA={balanceA}
                  balanceB={balanceB}
                  poolExists={poolExists}
                  exchangeRate={exchangeRate}
                  onTokenASelect={handleTokenASelect}
                  onTokenBSelect={handleTokenBSelect}
                  onSwap={swap}
                  calculateOutput={calculateOutput}
                  disabled={!connected || !isCorrectNetwork}
                />
              </TabsContent>

              <TabsContent value="liquidity">
                <LiquidityForm
                  tokenA={tokenA}
                  tokenB={tokenB}
                  tokenAAddress={tokenAAddress}
                  tokenBAddress={tokenBAddress}
                  balanceA={balanceA}
                  balanceB={balanceB}
                  poolExists={poolExists}
                  reservoirA={reservoirA}
                  reservoirB={reservoirB}
                  pendingRewards={pendingRewards}
                  lpTokens={lpTokens}
                  onTokenASelect={handleTokenASelect}
                  onTokenBSelect={handleTokenBSelect}
                  onAddLiquidity={addLiquidity}
                  onClaimRewards={claimRewards}
                  disabled={!connected || !isCorrectNetwork}
                  isExpanded={isExpanded}
                  showPoolInfo={showPoolInfo}
                  onToggleExpand={toggleExpand}
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

