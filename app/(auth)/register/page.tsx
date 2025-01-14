import { Register } from "@/components/auth/register-form"
import { Metadata } from "next"
import { constructMetadata } from "@/lib/utils"

export const metadata: Metadata = constructMetadata({
  title: "Register",
  description: "create a new account!",
  canonical: "/register"
})

export default function RegisterPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Register />
      </div>
    </div>
  )
}
