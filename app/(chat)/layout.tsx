import { cookies } from 'next/headers'
import { AppSidebar } from '@/components/custom/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import createClient from '@/lib/supabase/server'

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient();
  const user = await supabase.auth.getUser()
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get('sidebar:state')?.value === 'true'
  

  return (
    <SidebarProvider defaultOpen={isCollapsed}>
      <AppSidebar user={user?.data?.user ?? null} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
