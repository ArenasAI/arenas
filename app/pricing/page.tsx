import Footer from "@/components/footer"
import { Navbar } from "@/components/nav"
import PricingPage from "@/components/pricing"
import { constructMetadata } from "@/lib/utils"
import { Metadata } from "next"

export const metadata: Metadata = constructMetadata({
    title: "Pricing",
    description: "the pricing page for Arenas",
    canonical: "/pricing",
})

export default async function Page() {
    return (
        <>
        <div className="justify-items-center py-20">
            <Navbar/>
            <PricingPage />
            <Footer />
        </div>
        </>
    )
}