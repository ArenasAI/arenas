import { cookies } from 'next/headers'
import { getSession } from '@/db/cached-queries'
import { AppSidebar } from '@/components/custom/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get('sidebar:state')?.value === 'true'

  const user = await getSession();

  return (
    <SidebarProvider defaultOpen={isCollapsed}>
      <AppSidebar user={user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
