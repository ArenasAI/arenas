import PricingSuccess from "@/components/custom/success";
import { Navbar } from "@/components/nav";
import { Metadata } from "next";
import { constructMetadata } from "@/lib/utils";

export const metadata: Metadata = constructMetadata({
    title: "hello neighbor,,",
    description: "Thank you for your purchase!",
    canonical: "/pricing/success",
});

export default async function SuccessPage() {
    return (
        <>
            <Navbar />
            <div className="flex flex-col items-center justify-center h-screen">
                <PricingSuccess />
            </div>
        </>
    )
}