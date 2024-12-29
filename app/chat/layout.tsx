import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login?redirectTo=/chat')
  }

  return (
    <div className="flex h-screen bg-background">
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
