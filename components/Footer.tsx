"use client";

import Link from 'next/link';
import { Github, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Copyright text */}
        <div className="text-sm text-gray-600">
          © ArenasAI 2024, All Rights Reserved
        </div>

        {/* Social links */}
        <div className="flex items-center gap-4">
          <Link
            href="https://github.com/arenas-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Github size={20} />
          </Link>
          <Link
            href="https://linkedin.com/company/arenas-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Linkedin size={20} />
          </Link>
        </div>
      </div>
    </footer>
  );
}