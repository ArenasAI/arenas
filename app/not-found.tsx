import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/nav";

export const metadata: Metadata = constructMetadata({
    title: "Page Not Found",
    description: "The page you are looking for does not exist.",
    canonical: "/404",
});

const NotFoundPage: React.FC = () => {
    return (
        <>
            <Navbar />
        <section className="flex flex-col items-center justify-center h-screen">
                <div className="flex flex-col items-center justify-center h-screen">
                    <h1 className="text-2xl font-bold">Not Found</h1>
                <p>The page you are looking for does not exist.</p>
                <Link href="/" className="text-blue-500">Go back to the home page</Link>
            </div>
        </section>
        </>
    )
}

export default NotFoundPage;
