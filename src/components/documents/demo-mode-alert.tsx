"use client"

import { InfoIcon } from "@phosphor-icons/react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DEMO_MODE_MESSAGE } from "@/constants/document"

export function DemoModeAlert() {
  return (
    <Alert className="border-primary/30 bg-primary/5">
      <InfoIcon className="text-primary" />
      <AlertTitle>Demo Mode</AlertTitle>
      <AlertDescription>
        {DEMO_MODE_MESSAGE} File PDF tidak disimpan; Anda akan diminta memilih ulang file yang sama
        saat proses tanda tangan.
      </AlertDescription>
    </Alert>
  )
}
