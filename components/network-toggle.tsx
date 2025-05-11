"use client"

import { useNetwork } from "@/contexts/network-context"
import { NetworkType } from "@/lib/contract-utils"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react" // Import loading indicator

export function NetworkToggle() {
  const { networkType, toggleNetwork, isNetworkSwitching } = useNetwork()
  const isTestnet = networkType === NetworkType.TESTNET

  return (
    <button
      onClick={() => toggleNetwork()}
      className="flex items-center gap-2 px-2 py-1 rounded-md text-xs relative"
      title={isTestnet ? "شبکه تست" : "شبکه مین‌نت"}
      disabled={isNetworkSwitching}
    >
      <span className="font-medium">{isTestnet ? "شبکه تست" : " شبکه اصلی"}</span>
      <div
        className={cn(
          "relative h-5 w-10 rounded-full transition-colors duration-300 ease-in-out",
          isTestnet ? "bg-amber-500" : "bg-primary",
          isNetworkSwitching ? "opacity-70" : "opacity-100",
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 left-0.5 h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ease-in-out",
            isTestnet ? "translate-x-5" : "translate-x-0",
            isNetworkSwitching ? "animate-pulse" : "",
          )}
        />

        {/* Add loading indicator when switching */}
        {isNetworkSwitching && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-3 w-3 animate-spin text-white" />
          </div>
        )}
      </div>
    </button>
  )
}
