"use client";

import Link from 'next/link';
import { Github, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="container mx-auto">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex space-x-6 items-center justify-center">
            {/* Copyright text */}            
            <div className="text-sm text-gray-600">
              © ArenasAI 2024, All Rights Reserved
            </div>
          
            <div className="flex items-center gap-4">
          <Link
            href="https://github.com/arenas-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Github className="h-5 w-5" />
          </Link>
          <Link
            href="https://linkedin.com/company/arenas-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Linkedin className="h-5 w-5"/>
          </Link>
        </div>  
          </div>
        </div>
        
        {/* Social links */}
        
      </div>
    </footer>
  );
}