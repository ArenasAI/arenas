'use client'
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { dela } from '../ui/fonts';
import { PlusIcon } from '@/components/custom/icons';
import { SidebarHistory } from '@/components/custom/sidebar-history';
import { SidebarUserNav } from '@/components/custom/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { BetterTooltip } from '@/components/ui/tooltip';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function AppSidebar({ user }: { user: User | null }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [isCreating, setIsCreating] = useState(false);

  const handleNewChat = async () => {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    if (isCreating || error || !session?.access_token) {
      console.warn('User not authenticated.', error);
      return;
    }
  
    try {
      setIsCreating(true);
      const apiUrl = process.env.ARENAS_SERVER || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/new-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'New Chat' }),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server response:', response.status, errorData);
        throw new Error(`Failed to create chat: ${response.status}`);
      }
  
      const { chatId } = await response.json();
      setOpenMobile(false);
      router.push(`/chat/${chatId}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating new chat:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <div
              onClick={() => {
                setOpenMobile(false);
                router.push('/');
                router.refresh();
              }}
              className={`${dela.className} flex flex-row gap-3 items-center`}
            >
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                Arenas
              </span>
            </div>
            <BetterTooltip content="New Chat" align="start">
              <Button
                variant="ghost"
                className="p-2 h-fit"
                onClick={handleNewChat}
                disabled={isCreating || !user}
              >
                {isCreating ? (
                  <div className="animate-spin">...</div>
                ) : (
                  <PlusIcon />
                )}
              </Button>
            </BetterTooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarHistory user={user ?? undefined} />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-0">
        {user && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarUserNav user={user} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
