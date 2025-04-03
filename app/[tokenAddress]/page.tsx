import { Suspense } from "react"
import { notFound } from "next/navigation"
import { AnimatedBackground } from "@/components/animated-background"
import { TokenSwapPage } from "@/components/token-swap-page"
import { Loader2 } from "lucide-react"

interface TokenPageProps {
  params: {
    tokenAddress: string
  }
}

export default async function TokenPage({ params }: TokenPageProps) {
  const { tokenAddress } = params

  // Validate the token address format
  if (!tokenAddress || !tokenAddress.startsWith("0x") || tokenAddress.length !== 42) {
    return notFound()
  }

  // Check if it's a valid ERC20 token (this will be verified client-side)
  // We can't do full validation server-side since we need wallet connection

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <AnimatedBackground />
      <div className="z-10 w-full items-center justify-between text-sm">
        <h1 className="text-3xl font-bold text-center mb-8">🥝 کیوی‌سواپ</h1>
        <Suspense
          fallback={
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="mr-2">در حال بارگذاری...</span>
            </div>
          }
        >
          <TokenSwapPage tokenAddress={tokenAddress} />
        </Suspense>
      </div>
    </main>
  )
}

