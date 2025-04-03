import { AnimatedBackground } from "@/components/animated-background"
import { SwapInterface } from "@/components/swap-interface"
import { TOKEN_ADDRESSES } from "@/lib/constants"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <AnimatedBackground />
      <div className="z-10 w-full items-center justify-between text-sm">
        <h1 className="text-3xl font-bold text-center mb-8">🥝 کیوی‌سواپ</h1>
        <SwapInterface
          defaultTokenA="IRT"
          defaultTokenAAddress={TOKEN_ADDRESSES.IRT}
          defaultTokenB="USDT"
          defaultTokenBAddress={TOKEN_ADDRESSES.USDT}
        />
      </div>
    </main>
  )
}

