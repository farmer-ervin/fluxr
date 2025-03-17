"use client"

import * as React from "react"
import { FileText, GitBranch, Kanban, MessageSquare, ChevronDown, LogOut, User, StickyNote, Home } from "lucide-react"
import { Link, useLocation, useParams } from "react-router-dom"
import { useAuth } from "@/components/auth/AuthProvider"
import { useProduct } from "@/components/context/ProductContext"
import { ThemeToggle } from "@/components/ui/theme-toggle"

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const { productSlug } = useParams();
  const { currentProduct } = useProduct();
  const { isMobile } = useSidebar();
  
  // Only show product-specific navigation when we're in a product context
  const isProductContext = (location.pathname.includes('/product/') && 
                          productSlug !== 'new') || 
                          currentProduct?.slug !== undefined;
  
  const activeProductSlug = productSlug || currentProduct?.slug;
  const activeProductName = currentProduct?.name || "Product";
  
  // Define navigation items based on context
  const navItems = isProductContext ? [
    {
      label: 'PRD',
      href: `/product/${activeProductSlug}/prd`,
      icon: FileText,
      isActive: location.pathname.includes('/prd')
    },
    {
      label: 'User Flows',
      href: `/product/${activeProductSlug}/flows`,
      icon: GitBranch,
      isActive: location.pathname.includes('/flows')
    },
    {
      label: 'Development',
      href: `/product/${activeProductSlug}/development`,
      icon: Kanban,
      isActive: location.pathname.includes('/development')
    },
    {
      label: 'Prompts',
      href: `/product/${activeProductSlug}/prompts`,
      icon: MessageSquare,
      isActive: location.pathname.includes('/prompts')
    }
  ] : [
    {
      label: 'Products',
      href: '/',
      icon: Home,
      isActive: location.pathname === '/'
    }
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-brand-purple text-white">
                  <span className="font-bold">F</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Fluxr</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {isProductContext ? activeProductName : "Product Management"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent className="pt-4">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton 
                asChild 
                tooltip={item.label}
                active={item.isActive}
                className="transition-colors"
              >
                <Link to={item.href}>
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg bg-primary/10">
                    <AvatarFallback className="rounded-lg text-primary font-medium">{user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Profile</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email || ''}</span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 size-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
