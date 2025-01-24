// lib/data-fetching.ts
import { User } from '@supabase/supabase-js'
import createClient from "./supabase/server"
import { Subscription } from "./subscription"

type SubscriptionWithStatus = {
  user: User | null
  subscription: Subscription | null
}

export async function getSubscriptionStatus(userId?: string): Promise<SubscriptionWithStatus> {
  try {
    const supabase = await createClient()

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { user: null, subscription: null }
    }

    // Get subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId || user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (subscriptionError) {
      console.error('Error fetching subscription:', subscriptionError)
      return { 
        user,
        subscription: null 
      }
    }

    // Get message count
    const { count: messageCount, error: messageError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId || user.id)

    if (messageError) {
      console.error('Error fetching message count:', messageError)
    }

    const subscriptionWithCounts: Subscription = {
      ...subscription,
      messageCount: messageCount || 0,
      isTrialing: subscription.status === 'trialing',
      isActive: subscription.status === 'active',
      // Calculate remaining trial messages (if in trial)
      remainingMessages: subscription.status === 'trialing' ? 
        Math.max(0, 10 - (messageCount || 0)) : 
        null
    }

    return {
      user,
      subscription: subscriptionWithCounts
    }
  } catch (error) {
    console.error('Error in getSubscriptionStatus:', error)
    return {
      user: null,
      subscription: null
    }
  }
}
