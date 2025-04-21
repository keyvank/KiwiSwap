"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Wallet } from "lucide-react"
import { NetworkWarning } from "@/components/network-warning"
import { SwapForm } from "@/components/swap-form"
import { LiquidityForm } from "@/components/liquidity-form"
import { SwapHistory } from "@/components/swap-history"
import { useWallet } from "@/hooks/use-wallet"
import { usePool } from "@/hooks/use-pool"
import { TOKEN_ADDRESSES } from "@/lib/contract-utils"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CustomTokenInfo {
  symbol: string
  name: string
  address: string
  isCustom?: boolean
  logo?: string
}

interface SwapInterfaceProps {
  defaultTokenA?: string
  defaultTokenAAddress?: string
  defaultTokenB?: string
  defaultTokenBAddress?: string
  customToken?: CustomTokenInfo
}

export function SwapInterface({
  defaultTokenA = "USDT",
  defaultTokenAAddress = TOKEN_ADDRESSES.USDT,
  defaultTokenB = "AMOU",
  defaultTokenBAddress = TOKEN_ADDRESSES.AMOU,
  customToken,
}: SwapInterfaceProps) {
  const [activeTab, setActiveTab] = useState("swap")
  const [tokenA, setTokenA] = useState(defaultTokenA)
  const [tokenB, setTokenB] = useState(defaultTokenB)
  const [tokenAAddress, setTokenAAddress] = useState(defaultTokenAAddress)
  const [tokenBAddress, setTokenBAddress] = useState(defaultTokenBAddress)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showPoolInfo, setShowPoolInfo] = useState(false)
  const [customTokenAdded, setCustomTokenAdded] = useState(false)

  const { connected, account, isCorrectNetwork, switchNetwork, connect, isConnecting } = useWallet()

  const {
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
    swap,
    addLiquidity,
    removeLiquidity,
    getRemoveLiquidityPreview,
    estimateLPTokens,
    getSwapEvents,
  } = usePool({
    connected,
    account,
    isCorrectNetwork,
    tokenAAddress,
    tokenBAddress,
  })

  // Add custom token to localStorage if provided
  useEffect(() => {
    if (customToken && !customTokenAdded) {
      // Add custom token to localStorage
      try {
        const CUSTOM_TOKENS_STORAGE_KEY = "kiwiswap_custom_tokens"
        const savedTokens = localStorage.getItem(CUSTOM_TOKENS_STORAGE_KEY)
        let customTokens = []

        if (savedTokens) {
          customTokens = JSON.parse(savedTokens)

          // Check if token already exists
          const exists = customTokens.some(
            (token: CustomTokenInfo) => token.address.toLowerCase() === customToken.address.toLowerCase(),
          )

          if (!exists) {
            customTokens.push({
              ...customToken,
              logo: customToken.logo || "/placeholder.svg?height=32&width=32",
              isCustom: true,
            })
            localStorage.setItem(CUSTOM_TOKENS_STORAGE_KEY, JSON.stringify(customTokens))
          }
        } else {
          customTokens = [
            {
              ...customToken,
              logo: customToken.logo || "/placeholder.svg?height=32&width=32",
              isCustom: true,
            },
          ]
          localStorage.setItem(CUSTOM_TOKENS_STORAGE_KEY, JSON.stringify(customTokens))
        }

        setCustomTokenAdded(true)
      } catch (error) {
        console.error("Error adding custom token to localStorage:", error)
      }
    }
  }, [customToken, customTokenAdded])

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

    // اگر به تب نقدینگی یا تاریخچه رفتیم، حالت گسترده را فعال کنیم
    if (value === "liquidity" || value === "history") {
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

  // Check if we need to show the wallet connection overlay
  const showWalletOverlay = !connected && (activeTab === "liquidity" || activeTab === "history")

  return (
    <div
      className={cn(
        "w-full transition-all duration-500 ease-in-out",
        (activeTab === "liquidity" || activeTab === "history") && isExpanded
          ? "md:max-w-4xl mx-auto"
          : "max-w-md mx-auto",
      )}
    >
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">کیوی‌سواپ</CardTitle>
          </div>
          <CardDescription>مبادله بر بستر زنجیر</CardDescription>
          {connected && !isCorrectNetwork && <NetworkWarning onSwitchNetwork={switchNetwork} />}
        </CardHeader>
        <CardContent className="relative">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="mr-2">در حال بارگذاری...</span>
            </div>
          ) : (
            <Tabs defaultValue="swap" value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="swap">مبادله</TabsTrigger>
                <TabsTrigger value="liquidity">نقدینگی</TabsTrigger>
                <TabsTrigger value="history">تاریخچه</TabsTrigger>
              </TabsList>

              <div className="relative">
                {/* Wallet Connection Overlay */}
                {showWalletOverlay && (
                  <div className="absolute inset-0 z-10 backdrop-blur-sm bg-background/70 rounded-lg flex flex-col items-center justify-center p-6 text-center">
                    <Wallet className="h-12 w-12 mb-4 text-primary" />
                    <h3 className="text-lg font-medium mb-2">اتصال کیف پول</h3>
                    <p className="text-muted-foreground mb-4">
                      برای مشاهده {activeTab === "liquidity" ? "نقدینگی" : "تاریخچه مبادلات"} لطفا ابتدا کیف پول خود را
                      متصل کنید.
                    </p>
                    <Button onClick={connect} disabled={isConnecting} className="flex items-center gap-1">
                      {isConnecting ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          در حال اتصال...
                        </>
                      ) : (
                        <>
                          <Wallet className="h-4 w-4 ml-1" />
                          اتصال کیف پول
                        </>
                      )}
                    </Button>
                  </div>
                )}

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
                    account={account}
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
                    lpTokens={lpTokens}
                    totalLpSupply={totalLpSupply}
                    onTokenASelect={handleTokenASelect}
                    onTokenBSelect={handleTokenBSelect}
                    onAddLiquidity={addLiquidity}
                    onRemoveLiquidity={removeLiquidity}
                    onGetRemovalPreview={getRemoveLiquidityPreview}
                    estimateLPTokens={estimateLPTokens}
                    disabled={!connected || !isCorrectNetwork}
                    isExpanded={isExpanded}
                    showPoolInfo={showPoolInfo}
                    onToggleExpand={toggleExpand}
                  />
                </TabsContent>

                <TabsContent value="history">
                  <SwapHistory
                    tokenA={tokenA}
                    tokenB={tokenB}
                    tokenAAddress={tokenAAddress}
                    tokenBAddress={tokenBAddress}
                    poolExists={poolExists}
                    exchangeRate={exchangeRate}
                    getSwapEvents={getSwapEvents}
                    disabled={!connected || !isCorrectNetwork}
                    account={account}
                    isExpanded={isExpanded}
                    showPoolInfo={showPoolInfo}
                  />
                </TabsContent>
              </div>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

