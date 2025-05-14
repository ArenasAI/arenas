
import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";
import TermsOfServiceContent from "@/components/custom/terms-of-service";

export const metadata: Metadata = constructMetadata({
  title: "Terms of Service",
  description: "Terms of Service",
  canonical: "/terms-of-service",
});

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen">
            <div className="absolute top-0 left-0 w-full h-full -z-10" />
            <TermsOfServiceContent />
        </div>
    )
}