"use client";

import Link from 'next/link';
import { Github, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="container mx-auto">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-4 gap-8">
            {/* Company Section */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900">Company</h3>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/about" className="hover:text-gray-900">About</Link></li>
                <li><Link href="/pricing" className="hover:text-gray-900">Pricing</Link></li>
              </ul>
            </div>

            {/* Product Section */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900">Product</h3>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/chat" className="hover:text-gray-900">Chat</Link></li>
                <li><Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link></li>
              </ul>
            </div>

            {/* Social Links */}
            <div className="space-y-4 col-span-2">
              <h3 className="font-bold text-lg text-gray-900">Connect</h3>
              <div className="flex space-x-4">
                <Link href="https://github.com/ArenasAI" className="text-gray-600 hover:text-gray-900">
                  <Github className="h-6 w-6" />
                </Link>
                <Link href="https://linkedin.com/company/arenas-ai" className="text-gray-600 hover:text-gray-900">
                  <Linkedin className="h-6 w-6" />
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t text-sm text-gray-600">
            © ArenasAI 2024, All Rights Reserved
          </div>
        </div>
      </div>
    </footer>
  );
}
