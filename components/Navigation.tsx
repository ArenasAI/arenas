// components/Navigation.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Github, BookOpen } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { 
      href: "https://github.com/ArenasAI/arenas", 
      label: "GitHub",
      external: true 
    },
    { href: "/pricing", label: "Pricing" },
    {
      href: "https://discord.gg/spZ5yucbnn",
      label: "Discord"
    },
    { 
      href: "/docs",
      label: "Docs",
      external: false 
    },
  ];

  return (
    <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Nav Links container */}
          <div className="flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-xl font-bold text-gray-900"
            >
              <Image src="/assets/arenas.svg" alt="arenas logo" width={100} height={90} />
            </Link>

            {/* Nav Links - Now next to logo */}
            <div className="hidden md:flex md:items-center md:space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className={`${
                    isActive(link.href)
                      ? "text-gray-900 font-semibold"
                      : "text-gray-600 hover:text-gray-900"
                  } transition-colors duration-200 flex items-center gap-2`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Auth Buttons - Kept on the right */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
            >
              Register
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

      {/* Mobile menu remains unchanged */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className={`${
                  isActive(link.href)
                    ? "text-gray-900 font-semibold"
                    : "text-gray-600"
                } block px-3 py-2 rounded-md text-base hover:bg-gray-50 flex items-center gap-2`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            <div className="px-3 py-3 space-y-3">
              <Link
                href="/login"
                className="block text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
