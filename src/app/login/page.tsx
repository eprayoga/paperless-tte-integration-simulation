import type { Metadata } from "next"

import { LoginCard } from "@/components/auth/login-card"

export const metadata: Metadata = { title: "Login" }

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams
  return (
    <main className="from-primary/5 via-background to-background flex min-h-svh items-center justify-center bg-gradient-to-br p-4">
      <LoginCard errorCode={typeof error === "string" ? error : undefined} />
    </main>
  )
}
