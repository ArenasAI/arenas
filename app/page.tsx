import Hero from "@/components/hero";
import { Navbar } from "@/components/nav";
import { Metadata } from "next/types";

export const metadata: Metadata = {
    title: "Arenas - AI Powered Data Analyst",
    description: "Analyze data in minutes!",
  };

export default function Home() {
    return (
        <>
            <Navbar />
            <Hero />
        </>
    )
}