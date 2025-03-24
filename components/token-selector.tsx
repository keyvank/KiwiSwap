"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import Image from "next/image"
import { TOKEN_ADDRESSES } from "@/lib/contract-utils"

interface TokenSelectorProps {
  defaultToken?: string
  onSelect?: (token: string, address: string) => void
}

interface TokenInfo {
  symbol: string
  name: string
  logo: string
  address: string
}

export function TokenSelector({ defaultToken = "ETH", onSelect }: TokenSelectorProps) {
  const [selectedToken, setSelectedToken] = useState(defaultToken)
  const [tokens] = useState<TokenInfo[]>([
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

  return (
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
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

