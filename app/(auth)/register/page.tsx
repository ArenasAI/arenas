import { Register } from "@/components/auth/register-form"
import { Metadata } from "next"
import { constructMetadata } from "@/lib/utils"
import { Navbar } from "@/components/nav"
import createClient from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const metadata: Metadata = constructMetadata({
  title: "Register",
  description: "create a new account!",
  canonical: "/register"
})

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    redirect("/");
  }
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Navbar/>
        <Register />
      </div>
    </div>
  )
}
