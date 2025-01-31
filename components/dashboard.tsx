'use client'

import { User } from '@supabase/supabase-js'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface DashboardProps {
  user: User | null
  subscription?: {
    status: 'active' | 'trialing' | 'canceled' | 'inactive'
    messageCount: number
  }
}

export function Dashboard({ user, subscription = { status: 'inactive', messageCount: 0 } }: DashboardProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return null

  return (
    <div className="container mx-auto p-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Welcome to your Dashboard</CardTitle>
          <Button 
            variant="destructive" 
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback>
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">
                {user.user_metadata?.full_name || user.email}
              </h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-sm text-gray-500">
                Member since: {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Subscription Status Section */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Subscription Status</h3>
              <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                {subscription.status === 'active' ? 'Premium' : 'Free Trial'}
              </Badge>
            </div>
            
            {subscription.status === 'active' ? (
              <p className="text-sm text-gray-600">
                You have full access to all features
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Free trial: {10 - subscription.messageCount} messages remaining
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${(subscription.messageCount / 10) * 100}%` }}
                  ></div>
                </div>
                <Button 
                  variant="default" 
                  className="mt-4"
                  onClick={() => router.push('/pricing')}
                >
                  Upgrade to Premium
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
