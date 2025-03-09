import createClient from '@/lib/supabase/server'
import { getUserSubscription } from '@/lib/stripe'
import { Dashboard } from '@/components/dashboard'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/nav'
import SubscriptionStatus from '@/components/subscription-status'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const subscription = await getUserSubscription(user.id)

  const { count: messageCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const dashboardData = {
    user,
    subscription,
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="flex flex-col gap-8 pb-8 pt-6 md:py-20">
        <Navbar />
        <Dashboard 
          user={dashboardData.user}
        />  
        <div className="max-w-md mx-auto w-full">
          {/* Pass subscription as a serializable prop */}
          <SubscriptionStatus subscription={subscription ? {
            status: subscription.status,
            price_id: subscription.price_id,
            currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
          } : null} />
        </div>
      </div>
    </main>
  )
}
