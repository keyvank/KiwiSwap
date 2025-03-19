"use client"

import { Button } from "@/components/ui/button"

interface NetworkWarningProps {
  onSwitchNetwork: () => Promise<boolean>
}

export function NetworkWarning({ onSwitchNetwork }: NetworkWarningProps) {
  return (
    <div className="mt-2 p-2 bg-destructive/20 rounded-lg text-sm text-center">
      لطفا به شبکه Zanjir متصل شوید
      <Button variant="link" className="p-0 h-auto text-sm mr-2 text-primary" onClick={onSwitchNetwork}>
        تغییر شبکه
      </Button>
    </div>
  )
}

