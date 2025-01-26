import createClient from '@/lib/supabase/server'
import { Dashboard } from '@/components/dashboard'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/nav'

// Define the subscription status function
async function getSubscriptionStatus(userId: string) {
  const supabase = await createClient()
  
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    // Return default subscription state if error
    return {
      status: 'inactive',
      plan_type: 'free',
      trial_end: null
    }
  }

  return subscription || {
    status: 'inactive',
    plan_type: 'free',
    trial_end: null
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const subscription = await getSubscriptionStatus(user.id)

  // Get message count from messages table
  const { count: messageCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const dashboardData = {
    user,
    subscription: {
      status: subscription.status,
      plan_type: subscription.plan_type,
      trial_end: subscription.trial_end,
      messageCount: messageCount || 0,
      isTrialing: subscription.status === 'trialing',
      isActive: subscription.status === 'active'
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="flex flex-col gap-8 pb-8 pt-6 md:py-20">
        <Navbar />
        <Dashboard 
          user={dashboardData.user} 
          subscription={dashboardData.subscription}
        />
      </div>
    </main>
  )
}
