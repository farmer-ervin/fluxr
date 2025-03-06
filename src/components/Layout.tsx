import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import { useProduct } from './context/ProductContext';
import { LogOut, FileText, GitBranch, Kanban, MessageSquare, StickyNote, AlertCircle, PlusCircle, X, User, ChevronDown } from 'lucide-react';
import { HelpButton } from './HelpButton';
import { Button } from './ui/button';
import { EnvironmentBanner } from './EnvironmentBanner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { productSlug } = useParams();
  const { currentProduct, loadProductBySlug } = useProduct();
  const [quickNote, setQuickNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [activeProductSlug, setActiveProductSlug] = useState<string | null>(null);

  // Use productSlug from URL, or fall back to currentProduct
  useEffect(() => {
    if (productSlug) {
      setActiveProductSlug(productSlug);
      
      // If we don't have the current product or it's a different product,
      // load the product data to get the ID
      if (!currentProduct || currentProduct.slug !== productSlug) {
        loadProductData();
      } else {
        setActiveProductId(currentProduct.id);
      }
    } else if (currentProduct) {
      setActiveProductSlug(currentProduct.slug);
      setActiveProductId(currentProduct.id);
    }
  }, [productSlug, currentProduct]);

  const loadProductData = async () => {
    if (!productSlug) return;

    try {
      const product = await loadProductBySlug(productSlug);
      if (product) {
        setActiveProductId(product.id);
      }
    } catch (error) {
      console.error('Error loading product data:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAddNote = async () => {
    // Clear previous states
    setError(null);
    setShowError(false);
    setSuccessMessage(null);
    
    // Validate note content
    if (!quickNote.trim()) {
      setError("Please enter a note before adding");
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      return;
    }
    
    // First try using the URL productSlug
    let productIdToUse = activeProductId;
    let productSlugToUse = activeProductSlug;
    
    // If we don't have an active product but have a current product in context, use that
    if (!productIdToUse && currentProduct) {
      productIdToUse = currentProduct.id;
      productSlugToUse = currentProduct.slug;
    }
    
    // Validate product context exists
    if (!productIdToUse || !productSlugToUse) {
      setError("Missing product context. Please navigate to a product page first");
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      return;
    }

    try {
      setIsSaving(true);

      // Get the most recent note for this product (if any)
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('id, content')
        .eq('product_id', productIdToUse)
        .order('created_at', { ascending: false })
        .limit(1);

      if (notesError) {
        setError(`Error retrieving notes: ${notesError.message}`);
        setShowError(true);
        throw notesError;
      }

      // Check if we have an existing note
      const existingNote = notes && notes.length > 0 ? notes[0] : null;

      if (existingNote) {
        let updatedContent = existingNote.content;
        
        // Add proper line breaks between notes
        if (updatedContent) {
          // Ensure content ends with proper punctuation
          if (!updatedContent.match(/[.!?]$/)) {
            updatedContent += '.';
          }
          
          // Add two line breaks before new note
          updatedContent += '\n\n';
        }
        
        // Add the new note
        updatedContent += quickNote;
        
        const { error: updateError } = await supabase
          .from('notes')
          .update({ content: updatedContent })
          .eq('id', existingNote.id);

        if (updateError) {
          if (updateError.code === 'PGRST116') {
            setError("You don't have permission to update this note.");
          } else if (updateError.code?.startsWith('23')) {
            setError("Database constraint violation. Your note couldn't be saved.");
          } else {
            setError(`Error updating note: ${updateError.message}`);
          }
          setShowError(true);
          throw updateError;
        }
      } else {
        // Create a new note
        const productName = currentProduct?.name || 
                          (await getProductName(productIdToUse)) || 
                          'Product';
                          
        const { error: createError } = await supabase
          .from('notes')
          .insert({
            title: `${productName} Notes`,
            content: quickNote,
            product_id: productIdToUse
          });

        if (createError) {
          if (createError.code === 'PGRST116') {
            setError("You don't have permission to create notes for this product.");
          } else if (createError.code?.startsWith('23')) {
            setError("Database constraint violation. Your note couldn't be created.");
          } else {
            setError(`Error creating note: ${createError.message}`);
          }
          setShowError(true);
          throw createError;
        }
      }

      // Clear the input field and show success message
      setQuickNote('');
      setSuccessMessage("Note added successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error adding note:', error);
      // Error is already set in the specific error handling blocks
      if (!showError) {
        setError("An unexpected error occurred. Please try again.");
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to get product name if needed
  const getProductName = async (productId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('name')
        .eq('id', productId)
        .single();
        
      if (error || !data) return null;
      return data.name;
    } catch (error) {
      console.error('Error fetching product name:', error);
      return null;
    }
  };

  const handleViewNotes = () => {
    if (activeProductSlug) {
      navigate(`/product/${activeProductSlug}/notes`);
    } else if (currentProduct) {
      navigate(`/product/${currentProduct.slug}/notes`);
    }
  };

  // Only show product-specific navigation when we're in a product context
  const isProductContext = (location.pathname.includes('/product/') && 
                            activeProductSlug !== 'new') || 
                           currentProduct?.slug !== undefined;

  // Check if we're on the notes page
  const isNotesPage = location.pathname.includes('/notes');

  const mainNavItems: NavItem[] = [
    {
      label: 'Products',
      href: '/',
      icon: <FileText className="w-4 h-4" />
    }
  ];

  // Updated to remove Notes from the left navigation
  const productNavItems: NavItem[] = [
    {
      label: 'PRD',
      href: `/product/${activeProductSlug || currentProduct?.slug}/prd`,
      icon: <FileText className="w-4 h-4" />
    },
    {
      label: 'User Flows',
      href: `/product/${activeProductSlug || currentProduct?.slug}/flows`,
      icon: <GitBranch className="w-4 h-4" />
    },
    {
      label: 'Development',
      href: `/product/${activeProductSlug || currentProduct?.slug}/development`,
      icon: <Kanban className="w-4 h-4" />
    },
    {
      label: 'Prompts',
      href: `/product/${activeProductSlug || currentProduct?.slug}/prompts`,
      icon: <MessageSquare className="w-4 h-4" />
    }
  ];

  const navItems = isProductContext ? productNavItems : mainNavItems;

  return (
    <div className="min-h-screen bg-background">
      <EnvironmentBanner />
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-brand-purple">
                <Link to="/">Fluxr</Link>
              </h1>
              
              <nav className="flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      location.pathname === item.href
                        ? "bg-brand-purple text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {isProductContext && (
                <div className="flex-1 relative">
                  <div className="flex items-center gap-2 pr-2">
                    <input
                      type="text"
                      value={quickNote}
                      onChange={(e) => {
                        setQuickNote(e.target.value);
                        // Clear errors when user starts typing again
                        if (error) {
                          setError(null);
                          setShowError(false);
                        }
                      }}
                      placeholder="Add a quick note..."
                      className={cn(
                        "px-3 py-1 border rounded-md focus:outline-none focus:ring-1 text-sm w-60",
                        error && showError
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-brand-purple focus:border-brand-purple"
                      )}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleAddNote}
                      disabled={isSaving || !quickNote.trim()}
                      className="flex items-center gap-1 h-8"
                    >
                      {isSaving ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <PlusCircle className="w-3 h-3" />
                      )}
                      <span>Add</span>
                    </Button>
                    <Button
                      variant={isNotesPage ? "secondary" : "ghost"}
                      size="sm"
                      onClick={handleViewNotes}
                      className={cn(
                        "flex items-center gap-1 h-8",
                        isNotesPage ? "bg-brand-purple text-white" : ""
                      )}
                    >
                      <StickyNote className="w-3 h-3" />
                      <span>Notes</span>
                    </Button>
                  </div>
                  
                  {/* Error message popup */}
                  {error && showError && (
                    <div className="absolute top-full mt-2 right-0 bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded-md shadow-sm z-50 w-64 animate-in fade-in">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="text-xs">{error}</span>
                        </div>
                        <button 
                          onClick={() => setShowError(false)} 
                          className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Success message popup */}
                  {successMessage && (
                    <div className="absolute top-full mt-2 right-0 bg-green-50 border border-green-300 text-green-700 px-4 py-2 rounded-md shadow-sm z-50 w-64 animate-in fade-in">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">{successMessage}</span>
                        <button 
                          onClick={() => setSuccessMessage(null)} 
                          className="text-green-500 hover:text-green-700 ml-2"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {user && (
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Profile
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate('/profile')}>
                        <User className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <HelpButton />
    </div>
  );
}