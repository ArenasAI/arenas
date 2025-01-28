import Hero from "@/components/hero";
import { Navbar } from "@/components/nav";
import { Metadata } from "next/types";

export const metadata: Metadata = {
    title: "Arenas - AI Powered Data Analyst",
    description: "Replace Excel forever!",
  };

export default function Home() {
    return (
        <>
            <Navbar />
            <Hero />
        </>
    )
}