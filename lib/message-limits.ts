import { getUserSubscription } from '@/lib/stripe/stripe';
import createClient from '@/lib/supabase/server';

export async function checkMessageLimit(userId: string): Promise<{allowed: boolean, remaining: number}> {
  if (!userId) {
    return { allowed: false, remaining: 0 };
  }
  
  try {
    // Check if user is a subscriber
    const subscription = await getUserSubscription(userId);
    if (subscription?.status === 'active') {
      // Pro users have unlimited messages
      return { allowed: true, remaining: Infinity };
    }
  } catch (error) {
    console.error('Error checking subscription status:', error);
    // Fall through to free tier if subscription check fails
  }
  
  // For free users, check the message limit
  const supabase = await createClient();
  
  // Get current message count
  const { data: messageCount, error } = await supabase
    .from('user_message_counts')
    .select('free_messages_used')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    // If record doesn't exist, create one
    if (error.code === 'PGRST116') {
      await supabase
        .from('user_message_counts')
        .insert({ user_id: userId, free_messages_used: 0 });
      return { allowed: true, remaining: 10 };
    }
    console.error('Error checking message limit:', error);
    return { allowed: false, remaining: 0 };
  }
  
  const messagesUsed = messageCount?.free_messages_used || 0;
  const remaining = 10 - messagesUsed;
  
  return { 
    allowed: remaining > 0,
    remaining
  };
}

export async function incrementMessageCount(userId: string): Promise<void> {
  if (!userId) return;
  
  // Check if user is a subscriber (don't count if they are)
  const subscription = await getUserSubscription(userId);
  if (subscription?.status === 'active') {
    return; // Pro users don't need to increment count
  }
  
  const supabase = await createClient();
  
  // Increment message count
  await supabase.rpc('increment_message_count', { user_id: userId });
} 