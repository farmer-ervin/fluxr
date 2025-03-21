import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, handleSupabaseError } from '@/lib/supabase';
import { trackProductDeleted, trackProductUpdated, trackProductNameUpdated } from '@/lib/analytics';

interface Product {
  id: string;
  name: string;
  description: string;
  slug: string;
}

interface ProductContextType {
  currentProduct: Product | null;
  setCurrentProduct: (product: Product | null) => void;
  loadProductBySlug: (slug: string) => Promise<Product | null>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<boolean>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Key for storing current product in localStorage
const STORAGE_KEY = 'fluxr_current_product';

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const { productSlug } = useParams<{ productSlug?: string }>();

  // Load product from localStorage on initial render
  useEffect(() => {
    const storedProduct = localStorage.getItem(STORAGE_KEY);
    if (storedProduct) {
      try {
        setCurrentProduct(JSON.parse(storedProduct));
      } catch (error) {
        console.error('Error parsing stored product:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Update localStorage when currentProduct changes
  useEffect(() => {
    if (currentProduct) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentProduct));
    }
  }, [currentProduct]);

  // Load product by URL slug when it changes
  useEffect(() => {
    if (productSlug && (!currentProduct || currentProduct.slug !== productSlug)) {
      loadProductBySlug(productSlug).catch(err => {
        console.error('Error auto-loading product:', err);
      });
    }
  }, [productSlug]);

  // Function to load product by slug
  const loadProductBySlug = async (slug: string): Promise<Product | null> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error loading product by slug:', error);
        return null;
      }

      if (!data) {
        console.warn('No product found with slug:', slug);
        return null;
      }

      setCurrentProduct(data);
      return data;
    } catch (error) {
      console.error('Error loading product:', error);
      return null;
    }
  };

  const handleSetCurrentProduct = (product: Product | null) => {
    setCurrentProduct(product);
    if (product) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(product));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Function to update product
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Track product updates
      if (updates.name) {
        trackProductNameUpdated(updates.name);
      }
      trackProductUpdated();

      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  // Function to delete product
  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Track product deletion
      trackProductDeleted();

      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  return (
    <ProductContext.Provider 
      value={{ 
        currentProduct, 
        setCurrentProduct: handleSetCurrentProduct,
        loadProductBySlug,
        updateProduct,
        deleteProduct
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProduct() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
}