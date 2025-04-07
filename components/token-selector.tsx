"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, Plus, Check, AlertCircle, XCircle } from "lucide-react"
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
import { cn } from "@/lib/utils"

// First, import the identicon utility
import { generateIdenticon } from "@/lib/identicon-utils"

interface TokenSelectorProps {
  defaultToken?: string
  onSelect?: (token: string, address: string) => void
  customToken?: TokenInfo
  disabledToken?: string
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

export function TokenSelector({ defaultToken = "ETH", onSelect, customToken, disabledToken }: TokenSelectorProps) {
  const [selectedToken, setSelectedToken] = useState(defaultToken)
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Update the initial tokens state to only include IRT and USDT
  const [tokens, setTokens] = useState<TokenInfo[]>([
    {
      symbol: "IRT",
      name: "تومان",
      logo: "https://zanjir.xyz/irt.svg",
      address: TOKEN_ADDRESSES.IRT,
    },
    {
      symbol: "USDT",
      name: "تتر",
      logo: "https://cryptologos.cc/logos/tether-usdt-logo.svg",
      address: TOKEN_ADDRESSES.USDT,
    },
    {
      symbol: "ETH",
      name: "اتریوم",
      logo: "https://cryptologos.cc/logos/ethereum-eth-logo.svg",
      address: TOKEN_ADDRESSES.ETH,
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

  // Add custom token if provided
  useEffect(() => {
    if (customToken && !tokens.some((t) => t.address.toLowerCase() === customToken.address.toLowerCase())) {
      setTokens((prevTokens) => [
        ...prevTokens,
        {
          ...customToken,
          logo: customToken.logo || "/placeholder.svg?height=32&width=32",
          isCustom: true,
        },
      ])

      // If the custom token matches the default token, select it
      if (customToken.symbol === defaultToken) {
        setSelectedToken(customToken.symbol)
      }
    }
  }, [customToken, defaultToken])

  // ذخیره توکن‌های سفارشی در localStorage
  const saveCustomTokens = (customTokens: TokenInfo[]) => {
    try {
      localStorage.setItem(CUSTOM_TOKENS_STORAGE_KEY, JSON.stringify(customTokens))
    } catch (error) {
      console.error("خطا در ذخیره توکن‌های سفارشی:", error)
    }
  }

  const handleSelect = (token: string, address: string) => {
    // Don't allow selecting the disabled token
    if (token === disabledToken) return

    setSelectedToken(token)
    if (onSelect) {
      onSelect(token, address)
    }
    setIsOpen(false)
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
        // Update the customTokenInfo object creation to use an identicon instead of placeholder
        logo: generateIdenticon(customTokenAddress),
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

  // Custom toggle handler
  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  // Handle opening the add token dialog
  const handleOpenAddTokenDialog = () => {
    setIsOpen(false)
    // Use setTimeout to ensure the dropdown is closed before opening the dialog
    setTimeout(() => {
      setIsAddTokenDialogOpen(true)
    }, 100)
  }

  // Add this useEffect to handle clicks outside the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        setIsOpen(false)
      }
    }

    // Add event listener when dropdown is open
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    // Clean up the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <>
      <div className="relative">
        {/* Update the button styling to ensure perfect vertical alignment */}
        <Button
          ref={buttonRef}
          variant="outline"
          className="min-w-24 flex items-center justify-center gap-2 rounded-l-none h-10 py-0"
          onClick={handleToggle}
          type="button"
        >
          <div className="flex items-center gap-2">
            <Image
              src={selectedTokenInfo.logo || generateIdenticon(selectedTokenInfo.address)}
              alt={selectedToken}
              width={20}
              height={20}
              className="rounded-full"
            />
            <span className="flex items-center">{selectedToken}</span>
            <ChevronDown className="h-4 w-4" />
          </div>
        </Button>

        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-popover border border-border z-50"
            style={{ minWidth: "200px" }}
          >
            <div className="py-1 rounded-md bg-popover text-popover-foreground">
              {tokens.map((token) => {
                const isDisabled = token.symbol === disabledToken
                return (
                  <div
                    key={token.symbol}
                    onClick={() => !isDisabled && handleSelect(token.symbol, token.address)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm",
                      isDisabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {/* Update the Image component in the dropdown items to use identicons */}
                    <Image
                      src={token.logo || generateIdenticon(token.address)}
                      alt={token.symbol}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                    <span>{token.symbol}</span>
                    <span className="text-muted-foreground text-xs mr-2">{token.name}</span>
                    {isDisabled && <XCircle className="h-4 w-4 text-muted-foreground ml-auto" />}
                  </div>
                )
              })}

              <div className="border-t border-border my-1"></div>

              <div
                onClick={handleOpenAddTokenDialog}
                className="flex items-center gap-2 px-4 py-2 text-sm text-primary cursor-pointer hover:bg-accent"
              >
                <Plus className="h-4 w-4" />
                <span>افزودن توکن سفارشی</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* دیالوگ افزودن توکن سفارشی */}
      <Dialog open={isAddTokenDialogOpen} onOpenChange={setIsAddTokenDialogOpen}>
        <DialogContent className="sm:max-w-md z-[100]" dir="rtl">
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

