"use client"

import {
  ArrowRightIcon,
  QrCodeIcon,
  SealCheckIcon,
  ShieldCheckIcon,
  SignatureIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react"
import { useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { APP_NAME, AUTH_API } from "@/constants/app"

const LOGIN_ERRORS: Record<string, string> = {
  missing_token: "Token login tidak ditemukan pada callback Paperless.",
  invalid_token: "Token tidak valid atau sudah kedaluwarsa. Silakan login kembali.",
  validation_failed: "Gagal memvalidasi token ke Paperless. Coba beberapa saat lagi.",
  session_expired: "Sesi Anda telah berakhir. Silakan login kembali.",
  config: "Konfigurasi OAuth belum lengkap. Periksa file .env.local.",
}

export function LoginCard({ errorCode }: { errorCode?: string }) {
  const [redirecting, setRedirecting] = useState(false)
  const errorMessage = errorCode
    ? (LOGIN_ERRORS[errorCode] ?? LOGIN_ERRORS.validation_failed)
    : null

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="items-center text-center">
        <div className="bg-primary/10 text-primary mx-auto mb-2 flex size-14 items-center justify-center rounded-2xl">
          <SealCheckIcon className="size-8" />
        </div>
        <CardTitle className="text-xl">{APP_NAME}</CardTitle>
        <CardDescription>
          Masuk menggunakan akun Paperless untuk mencoba integrasi Tanda Tangan Elektronik.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive">
            <WarningCircleIcon />
            <AlertTitle>Login gagal</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

      </CardContent>

      <CardFooter className="flex-col gap-3">
        <Button
          asChild
          size="lg"
          className="w-full"
          aria-disabled={redirecting}
          onClick={() => setRedirecting(true)}
        >
          <a href={AUTH_API.login} className={redirecting ? "pointer-events-none" : undefined}>
            {redirecting ? <Spinner /> : <SealCheckIcon />}
            {redirecting ? "Mengalihkan ke Paperless..." : "Login with Paperless"}
            {!redirecting && <ArrowRightIcon className="ml-auto" />}
          </a>
        </Button>
        <p className="text-muted-foreground text-center text-xs">
          Website demo integrasi. Bukan aplikasi produksi.
        </p>
      </CardFooter>
    </Card>
  )
}
