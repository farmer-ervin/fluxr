"use client"

import * as React from "react"
import { FileText, GitBranch, Kanban, MessageSquare, ChevronDown, LogOut, User, StickyNote, Home, PlusCircle, Loader2, HelpCircle, Settings, Sun } from "lucide-react"
import { Link, useLocation, useParams, useNavigate } from "react-router-dom"
import { useAuth } from "@/components/auth/AuthProvider"
import { useProduct } from "@/components/context/ProductContext"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Product {
  id: string;
  name: string;
  description: string;
  slug: string;
  created_at: string;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  quickNote: string;
  setQuickNote: (note: string) => void;
  handleAddNote: () => Promise<void>;
  isSaving: boolean;
}

export function AppSidebar({ 
  quickNote, 
  setQuickNote, 
  handleAddNote, 
  isSaving,
  ...props 
}: AppSidebarProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { productSlug } = useParams();
  const { currentProduct, setCurrentProduct } = useProduct();
  const { isMobile } = useSidebar();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Only show product-specific navigation when we're in a product context
  const isProductContext = (location.pathname.includes('/product/') && 
                          productSlug !== 'new') || 
                          currentProduct?.slug !== undefined;
  
  const activeProductSlug = productSlug || currentProduct?.slug;
  const activeProductName = currentProduct?.name || "Product";

  // Fetch products for dropdown
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts((data || []) as unknown as Product[]);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);
  
  // Define navigation items based on context
  const navItems = isProductContext ? [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      isActive: location.pathname === '/'
    },
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
    },
    {
      label: 'Notes',
      href: `/product/${activeProductSlug}/notes`,
      icon: StickyNote,
      isActive: location.pathname.includes('/notes')
    }
  ] : [
    {
      label: 'Home',
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

  const handleProductSelect = (product: Product) => {
    if (!product.slug) {
      console.error('Product slug is missing:', product);
      return;
    }
    setCurrentProduct(product);
    navigate(`/product/${product.slug}/prd`);
  };

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader className="pb-4">
        {/* Fluxr Logo */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold text-primary">Fluxr</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      {/* Product Dropdown */}
      <SidebarContent className="pb-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center gap-2 max-w-[85%]">
                    {isProductContext && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <span className="text-xs font-bold">{activeProductName.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <span className="truncate">{isProductContext ? activeProductName : "Select a Product"}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuLabel>Products</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {products.map((product) => (
                  <DropdownMenuItem 
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <span className="text-xs font-bold">{product.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="truncate">{product.name}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/product/new" className="cursor-pointer">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Product
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Navigation Links */}
        <SidebarMenu className="mt-2">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href} className="py-0">
              <SidebarMenuButton
                asChild
                className={cn(
                  "transition-colors hover:text-primary hover:bg-primary/10",
                  location.pathname === item.href && "text-primary bg-primary/10"
                )}
              >
                <Link to={item.href} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="space-y-4">
        {/* Quick Note Input */}
        {isProductContext && (
          <>
            <Separator className="mx-2" />
            <SidebarMenu>
              <SidebarMenuItem className="px-2 py-2">
                <div className="w-full space-y-2">
                  <Input
                    type="text"
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    placeholder="Enter a note"
                    className="w-full h-9 text-sm"
                  />
                  <Button 
                    onClick={handleAddNote}
                    disabled={isSaving}
                    className="w-full h-9 text-sm"
                    size="sm"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving
                      </>
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Note
                      </>
                    )}
                  </Button>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </>
        )}
        
        <Separator className="mx-2" />
        
        {/* Support and Feedback Links */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="transition-colors hover:text-primary hover:bg-primary/10">
              <Link to="/support" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                <span>Support</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="transition-colors hover:text-primary hover:bg-primary/10">
              <Link to="/feedback" className="flex items-center gap-2">
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                >
                  <path 
                    d="M22 2L15 22L11 13L2 9L22 2Z" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Feedback</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <Separator className="mx-2" />
        
        {/* Simplified Profile Section */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="hover:bg-primary/10 transition-colors"
                >
                  <Avatar className="h-10 w-10 rounded-md">
                    <AvatarImage 
                      src={user?.user_metadata?.avatar_url || `https://avatar.vercel.sh/${user?.email || 'user'}.png`} 
                      alt={user?.email || 'User'} 
                    />
                    <AvatarFallback className="rounded-md bg-primary/10 text-primary font-medium">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.email?.split('@')[0]
                        .split(/[._-]/)
                        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                        .join(' ') || 'User'}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email || 'm@example.com'}</span>
                  </div>
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="ml-auto h-4 w-4 opacity-50"
                  >
                    <path 
                      d="M7 15L12 20L17 15M7 9L12 4L17 9" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/profile">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer p-2">
                  <ThemeToggle />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
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
