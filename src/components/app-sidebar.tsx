"use client"

import * as React from "react"
import { FileText, GitBranch, Kanban, MessageSquare, ChevronDown, ChevronRight, LogOut, User, StickyNote, Home, PlusCircle, Loader2, HelpCircle, Settings, Sun } from "lucide-react"
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
import { Label } from "@/components/ui/label"

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

  // Function to check if a path should be considered active
  const isPathActive = (path: string) => {
    // Special case for product development page
    if (location.pathname === '/product-development') {
      return false; // Don't highlight sub-items on product development page
    }
    // Regular matching for other pages
    return location.pathname.includes(path);
  };

  // Fetch products for dropdown
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts((data || []) as unknown as Product[]);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      fetchProducts();
    }
  }, [user?.id]);
  
  // Define navigation items based on context
  const navItems = React.useMemo(() => {
    return isProductContext ? [
      {
        label: 'Home',
        href: '/',
        icon: Home,
        isActive: location.pathname === '/'
      },
      {
        label: 'Product Development',
        icon: Kanban,
        isActive: location.pathname === '/product-development',
        subItems: [
          {
            label: 'PRD',
            href: `/product/${activeProductSlug}/prd`,
            icon: FileText,
            isActive: isPathActive('/prd')
          },
          {
            label: 'User Flows',
            href: `/product/${activeProductSlug}/flows`,
            icon: GitBranch,
            isActive: isPathActive('/flows')
          },
          {
            label: 'Development',
            href: `/product/${activeProductSlug}/development`,
            icon: Kanban,
            isActive: isPathActive('/development')
          },
          {
            label: 'Notes',
            href: `/product/${activeProductSlug}/notes`,
            icon: StickyNote,
            isActive: isPathActive('/notes')
          }
        ]
      },
      {
        label: 'Prompts',
        href: `/product/${activeProductSlug}/prompts`,
        icon: MessageSquare,
        isActive: isPathActive('/prompts')
      }
    ] : [
      {
        label: 'Home',
        href: '/',
        icon: Home,
        isActive: location.pathname === '/'
      },
      {
        label: 'Product Development',
        href: '/product-development',
        icon: Kanban,
        isActive: location.pathname === '/product-development'
      }
    ];
  }, [location.pathname, activeProductSlug, isProductContext, isPathActive]);

  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Store the previous product slug when navigating to product development
  const [previousProductSlug, setPreviousProductSlug] = useState<string | null>(null);

  useEffect(() => {
    // If we have a product context, store it for later use
    if (activeProductSlug) {
      setPreviousProductSlug(activeProductSlug);
    }
  }, [activeProductSlug]);

  useEffect(() => {
    // Auto-expand items that have active subitems or if we're on the product-development page
    const itemsToExpand = navItems
      .filter(item => 
        (item.subItems && item.subItems.some(subItem => subItem.isActive)) || 
        (item.label === 'Product Development' && location.pathname === '/product-development')
      )
      .map(item => item.label);
    
    // Only update if the expanded items would actually change
    const expandedItemsChanged = 
      itemsToExpand.length !== expandedItems.length || 
      itemsToExpand.some(item => !expandedItems.includes(item));
    
    if (expandedItemsChanged && itemsToExpand.length > 0) {
      setExpandedItems(itemsToExpand);
    }
  }, [location.pathname, navItems, expandedItems]);

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

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

  // Helper function to preserve the product context when navigating
  const preserveContextNavigation = (path: string) => {
    // For non-product routes like settings, just navigate directly
    if (!path.includes('/product/')) {
      navigate(path);
      return;
    }

    // If we're on the product development page and have a previous product context
    if (location.pathname === '/product-development' && previousProductSlug) {
      // If this is a product-specific route that needs a slug
      if (path.includes('/product/')) {
        // Use the previous product slug for navigation
        const correctedPath = path.replace(/\/product\/[^/]+/, `/product/${previousProductSlug}`);
        navigate(correctedPath);
      } else {
        navigate(path);
      }
    } else if (path.includes('/product/') && activeProductSlug) {
      // For other pages, ensure we're using the current active product slug
      const correctedPath = path.replace(/\/product\/[^/]+/, `/product/${activeProductSlug}`);
      navigate(correctedPath);
    } else {
      navigate(path);
    }
  };

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader className="pb-6">
        {/* Fluxr Logo */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/" className="flex items-center">
                <span className="text-3xl font-bold text-primary">Fluxr</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      {/* Product Dropdown */}
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem className="px-4">
            <Label className="text-sm font-medium text-muted-foreground mb-3">Current Product:</Label>
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
        <SidebarMenu className="mt-4">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label} className="py-0">
              {item.subItems ? (
                <>
                  <SidebarMenuButton
                    onClick={() => {
                      toggleExpanded(item.label);
                      // Only store the context if this is a product item and we have an active product
                      if (item.label === 'Product Development' && activeProductSlug) {
                        // Only update if the slug would change
                        if (previousProductSlug !== activeProductSlug) {
                          setPreviousProductSlug(activeProductSlug);
                        }
                      }
                      navigate('/product-development');
                    }}
                    className={cn(
                      "transition-colors hover:text-primary hover:bg-primary/10 justify-between",
                      (item.isActive || location.pathname === '/product-development') && "text-primary bg-primary/10"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    {expandedItems.includes(item.label) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </SidebarMenuButton>
                  {expandedItems.includes(item.label) && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.subItems.map((subItem) => (
                        <SidebarMenuButton
                          key={subItem.href}
                          asChild
                          className={cn(
                            "transition-colors hover:text-primary hover:bg-primary/10",
                            subItem.isActive && "text-primary bg-primary/10"
                          )}
                        >
                          <Link 
                            to={subItem.href} 
                            className="flex items-center gap-2"
                            onClick={(e) => {
                              e.preventDefault();
                              preserveContextNavigation(subItem.href);
                            }}
                          >
                            <subItem.icon className="h-4 w-4" />
                            <span>{subItem.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <SidebarMenuButton
                  asChild
                  className={cn(
                    "transition-colors hover:text-primary hover:bg-primary/10",
                    location.pathname === item.href && "text-primary bg-primary/10"
                  )}
                >
                  <Link 
                    to={item.href} 
                    className="flex items-center gap-2"
                    onClick={(e) => {
                      if (item.href.includes('/product/') || 
                          (location.pathname === '/product-development' && previousProductSlug)) {
                        e.preventDefault();
                        preserveContextNavigation(item.href);
                      }
                    }}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="space-y-1">
        {/* Quick Note Input */}
        {isProductContext && (
          <>
            <Separator className="mx-1" />
            <SidebarMenu>
              <SidebarMenuItem className="px-1">
                <div className="w-full space-y-1">
                  <Input
                    type="text"
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    placeholder="Type something..."
                    className="w-full h-8 text-sm bg-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                  />
                  <Button 
                    onClick={handleAddNote}
                    disabled={isSaving}
                    className="w-full h-8 text-sm"
                    size="sm"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        Saving
                      </>
                    ) : (
                      <>
                        <PlusCircle className="mr-1 h-4 w-4" />
                        Add Note
                      </>
                    )}
                  </Button>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </>
        )}
        
        <Separator className="mx-1" />
        
        {/* Support and Feedback Links */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="transition-colors hover:text-primary hover:bg-primary/10">
              <Link to="/support" className="flex items-center gap-1">
                <HelpCircle className="h-4 w-4" />
                <span>Support</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="transition-colors hover:text-primary hover:bg-primary/10">
              <Link to="/feedback" className="flex items-center gap-1">
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
        
        <Separator className="mx-1" />
        
        {/* Simplified Profile Section */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="w-full justify-start hover:bg-primary/10 transition-colors"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={user?.user_metadata?.avatar_url || `/avatars/default.png`}
                        alt={user?.email || 'User avatar'}
                      />
                      <AvatarFallback>
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="text-sm font-medium truncate">
                        {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50 ml-auto" />
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuItem asChild>
                  <Link 
                    to="/settings" 
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/settings');
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <ThemeToggle>
                    <Sun className="mr-2 h-4 w-4" />
                    Theme
                  </ThemeToggle>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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