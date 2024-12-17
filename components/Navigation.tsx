"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession, getProviders } from "next-auth/react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Navigation() {
  const supabaseClient = await supabase;
  const {
    data: {user},
    error,
  } = await supabaseClient.auth.getUser();

  const handleSignOut = async () => {
    "use server";
    const supabaseClient = supabase();
    await supabaseClient.auth.signOut();
    redirect("/");
  }
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About" },
  ];

  return (
    <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link 
              href="/" 
              className="text-xl font-bold text-gray-900"
            >
              <Image src="/assets/arenas-logo.png" alt="arenas logo" width={60} height={50} />
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${
                  isActive(link.href)
                    ? "text-gray-900 font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                } transition-colors duration-200`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/signin"
              className="text-gray-600 hover:text-gray-900"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-gradient-to-r from-coral-500 to-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-600 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${
                  isActive(link.href)
                    ? "text-gray-900 font-semibold"
                    : "text-gray-600"
                } block px-3 py-2 rounded-md text-base hover:bg-gray-50`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-3 py-3 space-y-3">
              <Link
                href="/signin"
                className="block text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="block w-full text-center bg-gradient-to-r from-coral-500 to-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
