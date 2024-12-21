import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function ChatHistorySkeleton() {
  return (
    <SidebarGroup>
      <div className="px-2 py-1 text-xs text-sidebar-foreground/50">Today</div>
      <SidebarGroupContent>
        <SidebarMenu>
          {[44, 32, 28, 64, 52].map((width, index) => (
            <SidebarMenuItem key={index}>
              <div className="rounded-md h-8 flex gap-2 px-2 items-center">
                <div
                  className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10 animate-pulse"
                  style={
                    {
                      '--skeleton-width': `${width}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
