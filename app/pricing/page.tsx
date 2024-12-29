import PricingPage from "@/components/pricing"
import { createClient } from "@/lib/supabase/server"
import { constructMetadata } from "@/lib/utils"
import { Metadata } from "next"

export const metadata: Metadata = constructMetadata({
    title: "Pricing",
    description: "the pricing page for Arenas",
    canonical: "/pricing",
})

export default async function Page() {
    const supabase = await createClient();
    const {
        data: {user},
    } = await supabase.auth.getUser();

    return (
        <>
            <PricingPage User={user} />
        </>
    )
}