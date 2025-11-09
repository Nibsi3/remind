'use client';

import * as React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  ListTodo,
  Sparkles,
  FileText,
  Settings,
  Bot,
  User,
  ChevronDown,
  LogOut,
  LogIn,
} from 'lucide-react';
import type { NavItem } from '@/lib/types';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader } from '@/components/ui/loader';
import { cn } from '@/lib/utils';


function UserMenu() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleLogout = () => {
    if(auth) {
      signOut(auth);
    }
  };

  if (isUserLoading) {
    return <Skeleton className="h-10 w-28" />;
  }

  if (!user) {
    return (
      <Button asChild variant="outline">
        <Link href="/login">
          <LogIn />
          Login
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />}
            <AvatarFallback>
              <User size={16} />
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline-block">
            {user.displayName || user.email}
          </span>
          <ChevronDown size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = React.useState(true);
  const [fadeout, setFadeout] = React.useState(false);

  React.useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeout(true);
    }, 2000); // Start fading out

    const removeTimer = setTimeout(() => {
      setLoading(false);
    }, 2500); // Remove from DOM after fade

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);


  const navItems: NavItem[] = [
    { href: '/reminders', title: 'Reminders', icon: ListTodo },
    { href: '/ai-builder', title: 'AI Builder', icon: Sparkles },
    { href: '/logs', title: 'Logs', icon: FileText },
    { href: '/settings', title: 'Settings', icon: Settings },
  ];

  return (
    <SidebarProvider>
       {loading && <Loader />}
      <Sidebar side="left" collapsible="icon">
        <SidebarHeader className="items-center justify-center text-sidebar-primary">
          <Bot size={28} />
          <span className="font-headline text-lg font-bold">Remind</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.title}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="items-center p-4">
          {/* ThemeToggle removed */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className={cn("flex flex-col transition-opacity duration-500", loading ? 'opacity-0' : 'opacity-100')}>
        <header className="flex h-14 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            {/* Page title could go here */}
          </div>
          <UserMenu />
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
