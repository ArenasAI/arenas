"use client"

import Image from 'next/image'
import Link from 'next/link'
import { getDateRange } from '@/lib/dates'
import { dela } from './ui/fonts'
import { DiscordLogo } from './ui/icons'

const footerCopyright = `© ${getDateRange()} Arenas, All rights reserved.`;

const TwitterIcon = ({ size = 20 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon = ({ size = 20 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
  </svg>
);

export default function Footer() {
    return (
        <footer className="mt-auto bg-background/80 backdrop-blur-sm border-t">
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="flex flex-col justify-start">
                        <Image 
                            src={"/assets/ar-dark.svg"}
                            alt="arenas-logo"
                            width={100} 
                            height={50}
                            className="mb-4"
                        />
                    </div>
                    <div>
                        <h3 className={`${dela.className} text-lg mb-5`}>get started</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <Link href="/pricing" className={`${dela.className} hover:text-foreground transition-colors`}>
                                    pricing
                                </Link>
                            </li>
                            <li>
                                <Link href="/usecases" className={`${dela.className} hover:text-foreground transition-colors`}>
                                    use cases
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className={`${dela.className} text-lg mb-5`}>resources</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <Link href="/docs" className={`${dela.className} hover:text-foreground transition-colors`}>
                                    docs
                                </Link>
                            </li>
                            <li>
                                <Link href="/changelog" className={`${dela.className} hover:text-foreground transition-colors`}>
                                    changelog
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className={`${dela.className} text-lg mb-5`}>company</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <Link href="/about" className={`${dela.className} hover:text-foreground transition-colors`}>
                                    about
                                </Link>
                            </li>
                            <li>
                                <a
                                    href="https://discord.gg/spZ5yucbnn" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className={`${dela.className} hover:text-foreground transition-colors`}
                                >
                                    discord
                                </a>
                            </li>
                            <li>
                                <Link href="/privacy" className={`${dela.className} hover:text-foreground transition-colors`}>
                                    privacy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms-of-service" className={`${dela.className} hover:text-foreground transition-colors`}>
                                    terms of service
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t flex justify-between items-center">
                    <p className={`${dela.className} text-sm text-muted-foreground`}>{footerCopyright}</p>
                    <div className="flex items-center space-x-4">
                        <a 
                            href="https://twitter.com/witharenas" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={`${dela.className} text-muted-foreground hover:text-foreground transition-colors`}
                            aria-label="Twitter"
                        >
                            <TwitterIcon />
                        </a>
                        <a 
                            href="https://linkedin.com/company/arenas" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={`${dela.className} text-muted-foreground hover:text-foreground transition-colors`}
                            aria-label="linkedIn"
                        >
                            <LinkedInIcon />
                        </a>
                        <a 
                            href="https://discord.gg/spZ5yucbnn"
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={`${dela.className} text-muted-foreground hover:text-foreground transition-colors`}
                            aria-label="discord"
                        >
                            <DiscordLogo />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
