"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Plus, Check, AlertCircle } from "lucide-react"
import Image from "next/image"
import { TOKEN_ADDRESSES } from "@/lib/contract-utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isValidERC20, getERC20Info } from "@/lib/contract-utils"
import { useToast } from "@/hooks/use-toast"

interface TokenSelectorProps {
  defaultToken?: string
  onSelect?: (token: string, address: string) => void
}

interface TokenInfo {
  symbol: string
  name: string
  logo: string
  address: string
  isCustom?: boolean
}

// کلید ذخیره‌سازی توکن‌های سفارشی در localStorage
const CUSTOM_TOKENS_STORAGE_KEY = "kiwiswap_custom_tokens"

export function TokenSelector({ defaultToken = "ETH", onSelect }: TokenSelectorProps) {
  const [selectedToken, setSelectedToken] = useState(defaultToken)
  const [tokens, setTokens] = useState<TokenInfo[]>([
    {
      symbol: "SOL",
      name: "سولانا",
      logo: "https://cryptologos.cc/logos/solana-sol-logo.svg",
      address: TOKEN_ADDRESSES.SOL,
    },
    {
      symbol: "ETH",
      name: "اتریوم",
      logo: "https://cryptologos.cc/logos/ethereum-eth-logo.svg",
      address: TOKEN_ADDRESSES.ETH,
    },
    {
      symbol: "USDT",
      name: "تتر",
      logo: "https://cryptologos.cc/logos/tether-usdt-logo.svg",
      address: TOKEN_ADDRESSES.USDT,
    },
    {
      symbol: "IRT",
      name: "تومان",
      logo: "/placeholder.svg?height=32&width=32",
      address: TOKEN_ADDRESSES.IRT,
    },
    {
      symbol: "DOGE",
      name: "دوج کوین",
      logo: "https://cryptologos.cc/logos/dogecoin-doge-logo.svg",
      address: TOKEN_ADDRESSES.DOGE,
    },
    {
      symbol: "BTC",
      name: "بیت کوین",
      logo: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg",
      address: TOKEN_ADDRESSES.BTC,
    },
  ])

  // دیالوگ افزودن توکن سفارشی
  const [isAddTokenDialogOpen, setIsAddTokenDialogOpen] = useState(false)
  const [customTokenAddress, setCustomTokenAddress] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState("")
  const [customTokenInfo, setCustomTokenInfo] = useState<TokenInfo | null>(null)
  const { toast } = useToast()

  // بارگذاری توکن‌های سفارشی از localStorage
  useEffect(() => {
    const loadCustomTokens = () => {
      try {
        const savedTokens = localStorage.getItem(CUSTOM_TOKENS_STORAGE_KEY)
        if (savedTokens) {
          const parsedTokens = JSON.parse(savedTokens) as TokenInfo[]
          // اضافه کردن توکن‌های سفارشی به لیست
          setTokens((prevTokens) => {
            // فیلتر کردن توکن‌های سفارشی قبلی
            const defaultTokens = prevTokens.filter((token) => !token.isCustom)
            // اضافه کردن توکن‌های سفارشی جدید
            return [...defaultTokens, ...parsedTokens]
          })
        }
      } catch (error) {
        console.error("خطا در بارگذاری توکن‌های سفارشی:", error)
      }
    }

    loadCustomTokens()
  }, [])

  // ذخیره توکن‌های سفارشی در localStorage
  const saveCustomTokens = (customTokens: TokenInfo[]) => {
    try {
      localStorage.setItem(CUSTOM_TOKENS_STORAGE_KEY, JSON.stringify(customTokens))
    } catch (error) {
      console.error("خطا در ذخیره توکن‌های سفارشی:", error)
    }
  }

  const handleSelect = (token: string, address: string) => {
    setSelectedToken(token)
    if (onSelect) {
      onSelect(token, address)
    }
  }

  const getTokenInfo = (symbol: string) => {
    return tokens.find((token) => token.symbol === symbol) || tokens[0]
  }

  const selectedTokenInfo = getTokenInfo(selectedToken)

  // بررسی اعتبار آدرس قرارداد توکن
  const validateTokenAddress = async () => {
    setIsValidating(true)
    setValidationError("")
    setCustomTokenInfo(null)

    try {
      // بررسی اعتبار آدرس
      if (!customTokenAddress || !customTokenAddress.startsWith("0x") || customTokenAddress.length !== 42) {
        setValidationError("آدرس قرارداد نامعتبر است")
        return
      }

      // بررسی اینکه آیا قبلاً این توکن اضافه شده است
      const existingToken = tokens.find((token) => token.address.toLowerCase() === customTokenAddress.toLowerCase())

      if (existingToken) {
        setValidationError("این توکن قبلاً به لیست اضافه شده است")
        return
      }

      // بررسی اینکه آیا آدرس یک قرارداد ERC20 معتبر است
      const isValid = await isValidERC20(customTokenAddress)

      if (!isValid) {
        setValidationError("آدرس وارد شده یک توکن ERC20 معتبر نیست")
        return
      }

      // دریافت اطلاعات توکن
      const tokenInfo = await getERC20Info(customTokenAddress)

      setCustomTokenInfo({
        symbol: tokenInfo.symbol,
        name: tokenInfo.name,
        logo: "/placeholder.svg?height=32&width=32", // لوگوی پیش‌فرض
        address: customTokenAddress,
        isCustom: true,
      })
    } catch (error) {
      console.error("خطا در بررسی آدرس توکن:", error)
      setValidationError("خطا در بررسی آدرس توکن. لطفاً دوباره تلاش کنید.")
    } finally {
      setIsValidating(false)
    }
  }

  // افزودن توکن سفارشی به لیست
  const addCustomToken = () => {
    if (!customTokenInfo) return

    // اضافه کردن توکن به لیست
    const updatedTokens = [...tokens, customTokenInfo]
    setTokens(updatedTokens)

    // ذخیره توکن‌های سفارشی
    const customTokens = updatedTokens.filter((token) => token.isCustom)
    saveCustomTokens(customTokens)

    // انتخاب توکن جدید
    setSelectedToken(customTokenInfo.symbol)
    if (onSelect) {
      onSelect(customTokenInfo.symbol, customTokenInfo.address)
    }

    // بستن دیالوگ و پاک کردن فرم
    setIsAddTokenDialogOpen(false)
    setCustomTokenAddress("")
    setCustomTokenInfo(null)

    // نمایش پیام موفقیت
    toast({
      title: "توکن اضافه شد",
      description: `توکن ${customTokenInfo.symbol} با موفقیت به لیست اضافه شد.`,
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-l-none" asChild>
          <Button variant="outline" className="min-w-24 flex items-center gap-2">
            <Image
              src={selectedTokenInfo.logo || "/placeholder.svg"}
              alt={selectedToken}
              width={20}
              height={20}
              className="rounded-full"
            />
            {selectedToken}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="rounded-l-none" align="end">
          {tokens.map((token) => (
            <DropdownMenuItem
              key={token.symbol}
              onClick={() => handleSelect(token.symbol, token.address)}
              className="cursor-pointer flex items-center gap-2"
            >
              <Image
                src={token.logo || "/placeholder.svg"}
                alt={token.symbol}
                width={20}
                height={20}
                className="rounded-full"
              />
              <span>{token.symbol}</span>
              <span className="text-muted-foreground text-xs mr-2">{token.name}</span>
              {token.isCustom && <span className="text-xs text-primary ml-auto">سفارشی</span>}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setIsAddTokenDialogOpen(true)}
            className="cursor-pointer flex items-center gap-2 text-primary"
          >
            <Plus className="h-4 w-4" />
            <span>افزودن توکن سفارشی</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* دیالوگ افزودن توکن سفارشی */}
      <Dialog open={isAddTokenDialogOpen} onOpenChange={setIsAddTokenDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>افزودن توکن سفارشی</DialogTitle>
            <DialogDescription>آدرس قرارداد توکن ERC20 را وارد کنید تا به لیست توکن‌ها اضافه شود.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tokenAddress">آدرس قرارداد توکن</Label>
              <div className="flex gap-2">
                <Input
                  id="tokenAddress"
                  placeholder="0x..."
                  value={customTokenAddress}
                  onChange={(e) => setCustomTokenAddress(e.target.value)}
                  dir="ltr"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={validateTokenAddress}
                  disabled={isValidating || !customTokenAddress}
                >
                  {isValidating ? <>بررسی...</> : <>بررسی</>}
                </Button>
              </div>

              {validationError && (
                <div className="text-destructive text-sm flex items-center gap-1 mt-1">
                  <AlertCircle className="h-4 w-4" />
                  {validationError}
                </div>
              )}
            </div>

            {customTokenInfo && (
              <div className="bg-secondary/50 p-3 rounded-md space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">نماد:</span>
                  <span>{customTokenInfo.symbol}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">نام:</span>
                  <span>{customTokenInfo.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">آدرس:</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]" dir="ltr">
                    {customTokenInfo.address}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setIsAddTokenDialogOpen(false)}>
              انصراف
            </Button>
            <Button type="button" onClick={addCustomToken} disabled={!customTokenInfo}>
              <Check className="h-4 w-4 ml-2" />
              افزودن توکن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

