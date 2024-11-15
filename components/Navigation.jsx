'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold">
            Arenas
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Main Links */}
            <div className="flex space-x-8">
              <Link 
                href="/about"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                About
              </Link>
              <Link 
                href="/pricing"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Pricing
              </Link>
              <Link 
                href="/docs"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Documentation
              </Link>
              <a 
                href="https://github.com/ArenasAI"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                GitHub
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Link 
                href="/signin"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign in
              </Link>
              <Link 
                href="/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-b border-gray-200">
            <Link 
              href="/about"
              className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              About
            </Link>
            <Link 
              href="/pricing"
              className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              Pricing
            </Link>
            <Link 
              href="/docs"
              className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              Documentation
            </Link>
            <a 
              href="https://github.com/ArenasAI"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              GitHub
            </a>
            <Link 
              href="/signin"
              className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              Sign in
            </Link>
            <Link 
              href="/signup"
              className="block px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
