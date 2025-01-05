'use client'

import Link from 'next/link'
import { dela } from './ui/fonts'
import { Menu, X, User, LogOut } from "lucide-react"
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { User as AuthUser } from '@supabase/supabase-js'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar({ user }: { user: AuthUser | null }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    
    const supabase = createClientComponentClient()
    const router = useRouter()

    const desktopNavVariants = {
        collapsed: {
            width: "80px",
            transition: { 
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
            }
        },
        expanded: {
            width: "auto",
            transition: { 
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
            }
        }
    }

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

    const handleSignOut = async () => {
        try {
            setIsLoading(true)
            const { error } = await supabase.auth.signOut()
            if (error) {
                throw error
            }
            router.refresh()
            router.push('/')
        } catch (error) {
            console.error('Error signing out:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session && user) {
                router.refresh()
            }
        }
        
        checkSession()
    }, [supabase, router, user])

    const commonLinks = (
        <>
            <Link 
                href="/pricing" 
                className="text-sm hover:text-gray-300 transition-colors"
                onClick={() => setIsOpen(false)}
            >
                pricing
            </Link>
            <Link 
                href="/docs" 
                className="text-sm hover:text-gray-300 transition-colors"
                onClick={() => setIsOpen(false)}
            >
                docs
            </Link>
            <a 
                target='_blank' 
                href='https://discord.gg/spZ5yucbnn' 
                rel='noreferrer noopener' 
                className="text-sm hover:text-gray-300 transition-colors"
                onClick={() => setIsOpen(false)}
            >
                discord
            </a>
            <a 
                target='_blank' 
                href='https://github.com/ArenasAI/arenas' 
                rel='noreferrer noopener' 
                className="text-sm hover:text-gray-300 transition-colors"
                onClick={() => setIsOpen(false)}
            >
                github
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
                    <User className="w-4 h-4" />
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
                    onClick={handleSignOut} 
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
            {/* Mobile Navbar */}
            <div className="md:hidden">
                <div className={`${dela.className} fixed top-0 left-0 right-0 flex items-center justify-between bg-zinc-900/95 px-4 h-16 z-50`}>
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

            {/* Desktop Navbar */}
            <div className="hidden md:block">
                <motion.div
                    className={`${dela.className} fixed top-8 left-1/2 -translate-x-1/2 flex items-center bg-zinc-900/95 rounded-full outline outline-blue-600 shadow-slate-50 h-12 overflow-hidden p-2 z-50`}
                    variants={desktopNavVariants}
                    initial={false}
                    animate={isHovered ? "expanded" : "collapsed"}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <div className="flex items-center w-full px-4">
                        <Link href={"/"}>
                            <motion.span 
                                className="text-xl font-semibold min-w-[32px] flex justify-center"
                                initial={false}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                {isHovered ? "Arenas" : "A"}
                            </motion.span>
                        </Link>
                        <motion.div 
                            className="flex items-center gap-6 ml-4 overflow-hidden whitespace-nowrap"
                            initial={false}
                            animate={{ opacity: isHovered ? 1 : 0 }}
                            transition={{ 
                                duration: 0.2,
                                ease: [0.4, 0, 0.2, 1]
                            }}
                        >
                            {commonLinks}
                            {user ? (
                                userMenu
                            ) : (
                                <>
                                    <Link href="/login" className="text-sm hover:text-gray-300 transition-colors">
                                        login
                                    </Link>
                                    ;
                                    <Link href="/register" className="text-sm hover:text-gray-300 transition-colors">
                                        register
                                    </Link>
                                </>
                            )}
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </>
    )
}
