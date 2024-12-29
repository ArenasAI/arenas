"use client"

import type { Metadata } from "next";

import "../globals.css"
import { Navbar } from "@/components/nav";
import Footer from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";


export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    AOS.init({
      once: true,
      disable: "phone",
      duration: 600,
      easing: "ease-out-sine",
    });
  });

  return (
    <>
      <main className="grow">
        {children}
      </main>
    </>
  );
}
1