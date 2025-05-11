"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { NetworkType, setNetwork, getCurrentNetworkType } from "@/lib/contract-utils"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/contexts/wallet-context" // Add this import

type NetworkChangeEvent = CustomEvent<{ networkType: NetworkType }>

// Create a global event for network changes
declare global {
  interface WindowEventMap {
    networkChanged: NetworkChangeEvent
  }
}

// Helper to dispatch network change event
export function dispatchNetworkChangeEvent(networkType: NetworkType) {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("networkChanged", {
      detail: { networkType },
    }) as NetworkChangeEvent
    window.dispatchEvent(event)
  }
}

interface NetworkContextType {
  networkType: NetworkType
  toggleNetwork: () => Promise<void> // Change return type to Promise<void>
  isTestnet: boolean
  isNetworkSwitching: boolean // Add this property
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined)

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [networkType, setNetworkType] = useState<NetworkType>(NetworkType.MAINNET)
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false)
  const { toast } = useToast()
  const wallet = useWallet() // Use the wallet context

  // Initialize network type from contract-utils
  useEffect(() => {
    setNetworkType(getCurrentNetworkType())
  }, [])

  // Update the toggleNetwork function to follow the specified flow
  const toggleNetwork = async () => {
    try {
      setIsNetworkSwitching(true)
      const newNetworkType = networkType === NetworkType.MAINNET ? NetworkType.TESTNET : NetworkType.MAINNET

      // Update the local state first to reflect the toggle change immediately
      setNetworkType(newNetworkType)

      // Update the network configuration
      setNetwork(newNetworkType)
      dispatchNetworkChangeEvent(newNetworkType)

      try {
        // First disconnect to reset connection state
        // This ensures MetaMask will prompt for connection again
        await wallet.disconnect()

        // Then switch to the new network (this will add the chain if needed)
        await wallet.switchNetwork()

        // Force MetaMask to show the connection prompt
        // This is the key step to ensure consent is requested every time
        await window.ethereum.request({ method: "eth_requestAccounts" })

        // Update wallet state after successful connection
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts && accounts.length > 0) {
          // Manually update wallet state since we're bypassing the connect method
          wallet.forceUpdateConnection(accounts[0])
        }

        toast({
          title: `شبکه تغییر کرد`,
          description: newNetworkType === NetworkType.MAINNET ? "شبکه مین‌نت فعال شد" : "شبکه تست فعال شد",
        })
      } catch (error) {
        console.error("Error during network switch and connect:", error)

        toast({
          title: "خطا در تغییر شبکه",
          description: `تغییر به ${newNetworkType === NetworkType.MAINNET ? "شبکه اصلی" : "شبکه تست"} با مشکل مواجه شد`,
          variant: "destructive",
        })

        // Note: We don't revert the network type here, as per requirements
        // The toggle should stay on the chosen network even if connection fails
      }
    } catch (error) {
      console.error("Error in toggleNetwork:", error)

      toast({
        title: "خطا در تغییر شبکه",
        description: "تغییر شبکه با مشکل مواجه شد",
        variant: "destructive",
      })
    } finally {
      setIsNetworkSwitching(false)
    }
  }

  const value = {
    networkType,
    toggleNetwork,
    isTestnet: networkType === NetworkType.TESTNET,
    isNetworkSwitching,
  }

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
}

export function useNetwork() {
  const context = useContext(NetworkContext)
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider")
  }
  return context
}
