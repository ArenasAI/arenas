import { Login } from "@/components/auth/login-form"
import { constructMetadata } from "@/lib/utils"
import { Metadata } from "next/types"

export const metadata: Metadata = constructMetadata({
  title: "Login",
  description: "sign in to your arenas account",
  canonical: "/login"
})

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Login />
      </div>
    </div>
  )
}