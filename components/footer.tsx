"use client"

import Image from 'next/image'

// components/footer.tsx
export default function Footer() {
    return (
        <footer className="mt-auto bg-background/80 backdrop-blur-sm border-t">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="justify items-center">
                        <Image src={"/assets/ar-dark.png"} alt="arenas-logo"
                            width={100} height={50}
                            style={{width: '50%', height: 'auto'}}
                            />
                    </div>
                    <div>
                        <h3 className="font-semibold mb-4">Resources</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="/docs">Documentation</a></li>
                            <li><a href="/changelog">Changelog</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-4">Company</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="/about">About</a></li>
                            <li><a href="/contact">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-4">Legal</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="/privacy">Privacy</a></li>
                            <li><a href="/terms">Terms</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
                    <p>© 2025 Arenas. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}
