import { Suspense } from "react"
import { AnimatedBackground } from "@/components/animated-background"
import { MarketplaceContent } from "@/components/marketplace-content"
import { Loader2 } from "lucide-react"

export default function MarketplacePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24 pt-8">
      <AnimatedBackground />
      <div className="z-10 w-full max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">بازارچه توکن‌ها</h1>
        <Suspense
          fallback={
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="mr-2">در حال بارگذاری...</span>
            </div>
          }
        >
          <MarketplaceContent />
        </Suspense>
      </div>
    </main>
  )
}

