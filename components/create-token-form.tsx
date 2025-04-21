"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/hooks/use-wallet"
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Coins,
  CoinsIcon as CoinIcon,
  ArrowLeftRight,
  Copy,
  Type,
  Tag,
  Percent,
  DollarSign,
  ShieldAlert,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ethers } from "ethers"
import {
  TOKEN_ADDRESSES,
  POOL_MANAGER_ADDRESS,
  POOL_MANAGER_ABI,
  getProvider,
  connectToToken,
} from "@/lib/contract-utils"
import { generateIdenticon } from "@/lib/identicon-utils"
import { toPersianRepresentation } from "@/lib/number-utils"
import Link from "next/link"

export function CreateTokenForm() {
  const { toast } = useToast()
  const { connected, account, isCorrectNetwork, connect } = useWallet()

  // Form state
  const [tokenName, setTokenName] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("")
  const [totalSupply, setTotalSupply] = useState("")
  const [usdtAmount, setUsdtAmount] = useState("")
  const [liquidityPercentage, setLiquidityPercentage] = useState(20) // Default 20%
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [createdTokenAddress, setCreatedTokenAddress] = useState<string | null>(null)

  // Calculate token price
  const [tokenPrice, setTokenPrice] = useState<string>("0")
  const [usdtPrice, setUsdtPrice] = useState<string>("0")

  // Calculate liquidity amounts
  const calculateLiquidityAmount = () => {
    if (!totalSupply || isNaN(Number(totalSupply))) return "0"

    const totalSupplyValue = Number(totalSupply)
    return (totalSupplyValue * (liquidityPercentage / 100)).toFixed(2)
  }

  // Calculate prices whenever liquidity amounts change
  useEffect(() => {
    const tokenLiquidity = Number(calculateLiquidityAmount())
    const usdtLiquidity = Number(usdtAmount || "0")

    if (tokenLiquidity > 0 && usdtLiquidity > 0) {
      // Price of token in USDT
      setTokenPrice((usdtLiquidity / tokenLiquidity).toFixed(6))

      // Price of USDT in token
      setUsdtPrice((tokenLiquidity / usdtLiquidity).toFixed(6))
    } else {
      setTokenPrice("0")
      setUsdtPrice("0")
    }
  }, [totalSupply, liquidityPercentage, usdtAmount])

  // Handle token creation
  const handleCreateToken = async () => {
    // Reset states
    setError(null)
    setSuccess(null)
    setCreatedTokenAddress(null)

    // Validate inputs
    if (!tokenName) {
      setError("لطفا نام توکن را وارد کنید")
      return
    }

    if (!tokenSymbol) {
      setError("لطفا نماد توکن را وارد کنید")
      return
    }

    if (!totalSupply || isNaN(Number(totalSupply)) || Number(totalSupply) <= 0) {
      setError("لطفا مقدار کل عرضه را به صورت عدد مثبت وارد کنید")
      return
    }

    if (!usdtAmount || isNaN(Number(usdtAmount)) || Number(usdtAmount) <= 0) {
      setError("لطفا مقدار USDT را به صورت عدد مثبت وارد کنید")
      return
    }

    // Check if user is connected
    if (!connected) {
      try {
        await connect()
      } catch (error) {
        setError("لطفا ابتدا کیف پول خود را متصل کنید")
        return
      }
    }

    // Check if user is on the correct network
    if (!isCorrectNetwork) {
      setError("لطفا به شبکه Zanjir متصل شوید")
      return
    }

    setIsCreating(true)

    try {
      // Get provider and signer
      const provider = getProvider()
      const signer = await provider.getSigner()

      // Connect to pool manager contract
      const poolManagerContract = new ethers.Contract(POOL_MANAGER_ADDRESS, POOL_MANAGER_ABI, signer)

      // Connect to USDT token
      const usdtTokenContract = await connectToToken(TOKEN_ADDRESSES.USDT)

      // Calculate amounts
      const totalSupplyWei = ethers.parseEther(totalSupply)
      const poolBaseSupplyWei = ethers.parseEther(calculateLiquidityAmount())
      const poolQuoteSupplyWei = ethers.parseEther(usdtAmount) // Use the user-specified USDT amount

      // Check if user has enough USDT
      const usdtBalance = await usdtTokenContract.balanceOf(account)
      if (usdtBalance < poolQuoteSupplyWei) {
        setError(`شما به اندازه کافی توکن USDT ندارید. مقدار مورد نیاز: ${ethers.formatEther(poolQuoteSupplyWei)} USDT`)
        setIsCreating(false)
        return
      }

      // Approve USDT token for pool manager
      const approveTx = await usdtTokenContract.approve(POOL_MANAGER_ADDRESS, poolQuoteSupplyWei)
      await approveTx.wait()

      // Create token and pool - use the correct function name from the ABI
      const tx = await poolManagerContract.createTokenAndPool(
        TOKEN_ADDRESSES.USDT,
        tokenName,
        tokenSymbol,
        totalSupplyWei,
        poolBaseSupplyWei,
        poolQuoteSupplyWei,
        { gasLimit: 5000000 }, // Add gas limit to ensure transaction has enough gas
      )

      // Wait for transaction to be mined
      const receipt = await tx.wait()

      // Extract the created token address from the event logs
      // This is a simplified approach - in a real implementation, you would parse the event logs properly
      const tokenApprovedEvent = receipt.logs.find((log) => log.topics[0] === ethers.id("TokenApproved(address)"))

      let tokenAddress = null
      if (tokenApprovedEvent) {
        // Parse the event data to get the token address
        const decodedData = ethers.AbiCoder.defaultAbiCoder().decode(
          ["address"],
          ethers.dataSlice(tokenApprovedEvent.data, 0),
        )
        tokenAddress = decodedData[0]
      }

      setCreatedTokenAddress(tokenAddress)
      setSuccess(`توکن ${tokenSymbol} با موفقیت ایجاد شد و استخر نقدینگی آن با USDT راه‌اندازی شد.`)

      // Reset form
      setTokenName("")
      setTokenSymbol("")
      setTotalSupply("")
      setUsdtAmount("")
      setLiquidityPercentage(20)
    } catch (error) {
      console.error("Error creating token:", error)
      setError("خطا در ایجاد توکن. لطفا دوباره تلاش کنید.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="space-y-6 pt-6" dir="rtl">
        {success && createdTokenAddress ? (
          // Minimal success view - shows only essential information
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <h2 className="text-xl font-medium">توکن با موفقیت ایجاد شد</h2>
            </div>

            <div className="bg-secondary/50 p-4 rounded-lg space-y-4">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">توکن شما با موفقیت ایجاد و به استخر نقدینگی اضافه شد</p>
                </div>
              </div>

              <div className="flex items-center">
                <p className="text-sm text-muted-foreground ml-2">آدرس توکن:</p>
                <code className="text-xs bg-background/70 p-1 rounded overflow-hidden flex-1 truncate" dir="ltr">
                  {createdTokenAddress}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1"
                  onClick={() => {
                    navigator.clipboard.writeText(createdTokenAddress)
                    toast({
                      title: "کپی شد",
                      description: "آدرس توکن در کلیپ‌بورد کپی شد.",
                    })
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Link href={`/swap/${createdTokenAddress}`}>
                <Button>
                  <ArrowLeftRight className="ml-2 h-4 w-4" />
                  شروع مبادله
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(null)
                  setCreatedTokenAddress(null)
                }}
              >
                ایجاد توکن جدید
              </Button>
            </div>
          </div>
        ) : (
          // Form view remains the same
          <>
            <h1 className="text-3xl font-bold text-center mb-4">توکنت رو بساز!</h1>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>خطا</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tokenName" className="flex items-center gap-1">
                    <Type className="h-4 w-4" />
                    نام توکن
                  </Label>
                  <Input
                    id="tokenName"
                    placeholder="مثال: کیوی کوین"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground">حداکثر 20 کاراکتر</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tokenSymbol" className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    نماد توکن
                  </Label>
                  <Input
                    id="tokenSymbol"
                    placeholder="مثال: KIWI"
                    value={tokenSymbol}
                    onChange={(e) => {
                      // Only allow English alphabet (A-Z, a-z)
                      const filteredValue = e.target.value.replace(/[^A-Za-z]/g, "")
                      setTokenSymbol(filteredValue.toUpperCase())
                    }}
                    maxLength={5}
                  />
                  <p className="text-xs text-muted-foreground">حداکثر 5 کاراکتر</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalSupply" className="flex items-center gap-1">
                    <Coins className="h-4 w-4" />
                    عرضه کل
                  </Label>
                  <Input
                    id="totalSupply"
                    type="number"
                    placeholder="مثال: 1000000"
                    value={totalSupply}
                    onChange={(e) => setTotalSupply(e.target.value)}
                    min="0"
                    step="1"
                  />
                  {totalSupply && !isNaN(Number(totalSupply)) && Number(totalSupply) > 0 && (
                    <p className="text-xs text-primary mt-1">{toPersianRepresentation(totalSupply)} توکن</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    تعداد کل توکن‌هایی که می‌خواهید ایجاد کنید (مثلاً یک میلیون)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Percent className="h-4 w-4" />
                    درصد نقدینگی اولیه ({liquidityPercentage}%)
                  </Label>
                  <Slider
                    value={[liquidityPercentage]}
                    onValueChange={(values) => setLiquidityPercentage(values[0])}
                    min={1}
                    max={100}
                    step={1}
                  />
                  {totalSupply && !isNaN(Number(totalSupply)) && Number(totalSupply) > 0 && (
                    <p className="text-xs text-primary mt-1">
                      {toPersianRepresentation(calculateLiquidityAmount())} توکن
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">درصدی از کل عرضه که به استخر نقدینگی اضافه می‌شود</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usdtAmount" className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    مقدار USDT
                  </Label>
                  <Input
                    id="usdtAmount"
                    type="number"
                    placeholder="مثال: 1000"
                    value={usdtAmount}
                    onChange={(e) => setUsdtAmount(e.target.value)}
                    min="0"
                    step="1"
                  />
                  {usdtAmount && !isNaN(Number(usdtAmount)) && Number(usdtAmount) > 0 && (
                    <p className="text-xs text-primary mt-1">{toPersianRepresentation(usdtAmount)} دلار</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    مقدار دلار (USDT) که می‌خواهید به استخر نقدینگی اضافه کنید (تعیین‌کننده قیمت اولیه توکن)
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-background">
                      {tokenSymbol ? (
                        <img
                          src={generateIdenticon(tokenSymbol) || "/placeholder.svg"}
                          alt={tokenSymbol}
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <CoinIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{tokenName || "نام توکن"}</h4>
                      <p className="text-sm text-muted-foreground">{tokenSymbol || "نماد"}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>عرضه کل:</span>
                      <span dir="ltr" className="font-mono">
                        {totalSupply ? Number(totalSupply).toLocaleString() : "0"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{tokenSymbol ? `نقدینگی اولیه ${tokenSymbol}` : "نقدینگی اولیه توکن"}:</span>
                      <span dir="ltr" className="font-mono">
                        {calculateLiquidityAmount() ? Number(calculateLiquidityAmount()).toLocaleString() : "0"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>نقدینگی اولیه USDT:</span>
                      <span dir="ltr" className="font-mono">
                        {usdtAmount ? Number(usdtAmount).toLocaleString() : "0"}
                      </span>
                    </div>
                  </div>

                  {/* Price information */}
                  {Number(tokenPrice) > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/40">
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <ArrowLeftRight className="h-4 w-4 ml-1 text-primary" />
                        قیمت تقریبی
                      </h4>
                      <div className="flex items-center text-sm">
                        <div className="flex-1 text-right" dir="ltr">
                          1 {tokenSymbol}
                        </div>
                        <div className="text-xl px-3 text-primary">=</div>
                        <div className="flex-1 text-left" dir="ltr">
                          {tokenPrice} USDT
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-primary/10 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <h3 className="font-medium mb-1">نکات مهم</h3>
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        <li>برای ایجاد استخر نقدینگی، به توکن USDT نیاز دارید</li>
                        <li>پس از ایجاد توکن، شما مالک کل عرضه آن خواهید بود</li>
                        <li>بخشی از توکن‌ها به استخر نقدینگی اضافه می‌شود</li>
                        <li>توکن‌های LP به کیف پول شما واریز می‌شود</li>
                        <li>قیمت اولیه توکن بر اساس نسبت USDT به تعداد توکن‌های اضافه شده به استخر تعیین می‌شود</li>
                      </ul>

                      <div className="mt-4 pt-2 border-t border-primary/20">
                        <Button onClick={handleCreateToken} disabled={isCreating} className="w-full">
                          {isCreating ? (
                            <>
                              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                              در حال ایجاد توکن...
                            </>
                          ) : (
                            "ایجاد توکن"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

