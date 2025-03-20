import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import { useProduct } from './context/ProductContext';
import { AlertCircle, Loader2, PlusCircle } from 'lucide-react';
import { Button } from './ui/button';
import { EnvironmentBanner } from './EnvironmentBanner';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { AppSidebar } from './app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen h-screen w-full bg-background overflow-hidden">
        <EnvironmentBanner />
        <div className="flex-none">
          <AppSidebar 
            quickNote={quickNote}
            setQuickNote={setQuickNote}
            handleAddNote={handleAddNote}
            isSaving={isSaving}
          />
        </div>
        <div className="flex-1 overflow-hidden flex flex-col h-full">
          <SidebarInset className="w-full h-full flex flex-col">
            {/* Error and success messages */}
            {showError && error && (
              <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700 shadow-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            {successMessage && (
              <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700 shadow-sm">
                <div className="h-5 w-5 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-700">✓</span>
                </div>
                <p>{successMessage}</p>
              </div>
            )}

            {/* Main content */}
            <main className="flex-1 p-4 md:p-6 overflow-auto h-full">
              <div className="w-full h-full">
                {children}
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}