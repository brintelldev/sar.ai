import { useState, useEffect } from 'react';
import { Navbar } from './navbar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        // Layout mobile com sidebar colapsável
        <SidebarProvider defaultOpen={false}>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="flex-1">
                <Navbar />
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      ) : (
        // Layout desktop com sidebar fixa
        <div className="flex h-screen">
          <div className="w-64 flex-shrink-0">
            <SidebarProvider defaultOpen={true}>
              <AppSidebar />
            </SidebarProvider>
          </div>
          <div className="flex-1 flex flex-col">
            <header className="h-16 shrink-0 border-b px-4 flex items-center">
              <Navbar />
            </header>
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
