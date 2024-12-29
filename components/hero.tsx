import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "./nav";

export default function Hero() {
  return (
    <div className="items-center justify-items-center min-h-screen p-8 pb-10 gap-16 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-15 row-start-2 items-center sm:items-start">
        <Navbar />
        <div className="container mx-auto px-4 mt-32">
          <div className="max-w-2xl">
          <h1 className="text-xl md:text-6xl lg:text-5xl font-bold tracking-tight">
            data science just got easier.
          </h1>
          </div>

          <div className="max-w-2xl p-10">
            <h1 className="text-xl md:text-4xl lg:text-5xl font-bold">
                Introducing, {" "}
                <span className="relative inline-block">ArenasAI
                    <span className="absolute inset-x-0 bottom-0 h-10 bg-blue-700 opacity-80 transform -translate-x-1 -rotate-2 -z-10 "></span>
                    <span className="absolute inset-x-9 bottom-0 h-10 bg-blue-700 opacity-100 transform -translate-x-1 -rotate-2 -z-10 "></span>
                </span>
            </h1>
            {/* <p className="flex justify-center text-center p-10">Your AI Data Scientist</p> */}
          </div>
        </div>
        <div>
        <Link
            href="/chat"
            className="inline-flex items-center gap-2 mt-8 bg-zinc-700/50 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-zinc-700/60 transition-colors"
          >
            get to work
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </main>
    </div>
  );
}
