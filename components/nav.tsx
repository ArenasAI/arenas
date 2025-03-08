"use client"

import Link from 'next/link'
import { dela } from './ui/fonts'
import { Menu, X, LogOut } from "lucide-react"
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signOut } from '@/app/(auth)/actions'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { User } from '@supabase/supabase-js'

const supabase = createClient()


export function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading] = useState(false)
    const [user, setUser] = useState<User | null>(null)

    const mobileNavVariants = {
        hidden: {
            opacity: 0,
            transition: { 
                duration: 0.15,
                ease: [0.4, 0, 0.2, 1]
            }
        },
        visible: {
            opacity: 1,
            transition: { 
                duration: 0.15,
                ease: [0.4, 0, 0.2, 1]
            }
        }
    }

    useEffect(() => {
        // Get initial session
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        getUser()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase.auth])
    const commonLinks = (
        <>
            <Link 
                href="/pricing" 
                className="text-sm text-foreground/80 hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
            >
                pricing
            </Link>
            <Link 
                href="/learn" 
                className="text-sm text-foreground/80 hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
            >
                learn
            </Link>
            <Link 
                href="/docs" 
                className="text-sm text-foreground/80 hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
            >
                docs
            </Link>
            <Link 
                href="/files" 
                className="text-sm text-foreground/80 hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
            >
                files
            </Link>
            <a 
                target='_blank' 
                href='https://discord.gg/spZ5yucbnn' 
                rel='noreferrer noopener' 
                className="text-sm text-foreground/80 hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
            >
                discord
            </a>
        </>
    )

    const userMenu = (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 text-sm hover:text-gray-300 transition-colors">
                {user?.user_metadata?.avatar_url ? (
                    <Image
                        src={user.user_metadata.avatar_url}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>
                )}
                <span>you</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>
                    {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <Link href="/you" className="w-full">
                        you
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Link href="/settings" className="w-full">
                        Settings
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                    onClick={signOut} 
                    className="text-red-600"
                    disabled={isLoading}
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    {isLoading ? 'Signing out...' : 'Sign out'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )

    return (
        <>
            <div className="md:hidden">
                <div className={`${dela.className} fixed top-0 left-0 right-0 flex items-center justify-between bg-background/95 dark:bg-background/95 border-b border-border px-4 h-16 z-50`}>
                    <Link href="/" className="text-xl font-semibold">
                        Arenas
                    </Link>
                    <button 
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            variants={mobileNavVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="fixed top-16 left-0 right-0 bg-zinc-900/95 z-40 border-t border-zinc-800"
                        >
                            <div className="flex flex-col p-4 space-y-4">
                                {commonLinks}
                                {user ? (
                                    userMenu
                                ) : (
                                    <>
                                        <Link 
                                            href="/login" 
                                            className="text-sm hover:text-gray-300 transition-colors py-2"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            login
                                        </Link>
                                        <Link 
                                            href="/register" 
                                            className="text-sm hover:text-gray-300 transition-colors py-2"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            register
                                        </Link>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="hidden md:block">
                <div
                    className={`${dela.className} fixed top-8 left-1/2 -translate-x-1/2 flex items-center bg-background/95 dark:bg-background/95 rounded-full border border-border h-12 p-2 z-50`}
                >
                    <div className="flex items-center w-full px-4">
                        <Link href="/">
                            <span className="text-xl font-semibold">
                                Arenas
                            </span>
                        </Link>
                        <div className="flex items-center gap-6 ml-4">
                            {commonLinks}
                            {user ? (
                                userMenu
                            ) : (
                                <>
                                    <Link href="/login" className="text-sm text-foreground/80 hover:text-foreground transition-colors">
                                        login
                                    </Link>
                                    ;
                                    <Link href="/register" className="text-sm text-foreground/80 hover:text-foreground transition-colors">
                                        register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
