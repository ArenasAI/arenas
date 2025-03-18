import { Navbar } from "@/components/nav"
import PricingPage from "@/components/pricing"
import { getSession } from "@/lib/cached/cached-queries"
import { constructMetadata } from "@/lib/utils"
import { Metadata } from "next"
import createClient from "@/lib/supabase/server"

export const metadata: Metadata = constructMetadata({
    title: "Pricing",
    description: "the pricing page for Arenas",
    canonical: "/pricing",
})

export default async function Page() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return (
        <>
        <div className="justify-items-center py-20">
            <Navbar/>
            <PricingPage />
        </div>
        </>
    )
}