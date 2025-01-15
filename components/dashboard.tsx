'use client'

import { LogOut } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <main className="container mx-auto py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Card */}
          <Card className="p-6 bg-black border-zinc-800">
            <div className="flex items-start gap-4">
              <Image
                src="/placeholder.svg"
                alt="Profile"
                width={64}
                height={64}
                className="rounded-full"
              />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">
                  mubashir1osmani
                </h2>
                <p className="text-zinc-200 mb-4">
                  ilikewafflesomcuh@gmail.com
                </p>
                <Button
                  variant="outline"
                  className="border-zinc-800 text-white hover:bg-zinc-900 hover:text-white"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </Button>
              </div>
            </div>
          </Card>

          {/* Subscription Card */}
          <Card className="p-6 bg-black border-zinc-800">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">
                subscription plan
              </h2>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white">
                    MONTHLY / $45
                  </p>
                  <p className="text-sm text-zinc-200">active</p>
                </div>
                <Button
                  variant="outline"
                  className="border-zinc-800 text-white hover:bg-zinc-900 hover:text-white"
                >
                  Cancel subscription
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

