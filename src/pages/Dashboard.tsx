import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Trash2, FileUp, GitBranch, Kanban } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useProduct } from '@/components/context/ProductContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/PageTitle';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProductDescription } from '@/components/ProductDescription';

interface Product {
  id: string;
  name: string;
  description: string;
  slug: string;
  created_at: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrentProduct, deleteProduct } = useProduct();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const handleProductSelect = (product: Product) => {
    if (!product.slug) {
      console.error('Product slug is missing:', product);
      return;
    }
    setCurrentProduct(product);
    navigate(`/product/${product.slug}/prd`);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct(productToDelete.id);
      setProducts(products.filter(p => p.id !== productToDelete.id));
      setProductToDelete(null);
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product. Please try again.');
    }
  };

  if (!user) {
    navigate('/');
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <PageTitle title="Your Products" />
      
      {/* Welcome Message */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6 mb-6 md:mb-8">
        <div className="flex items-center gap-4 border-b border-border pb-4 mb-4">
          <h2 className="text-lg sm:text-xl font-bold">Welcome to Fluxr</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-purple/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileUp className="w-4 h-4 text-brand-purple" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Create/Upload PRD</h3>
              <p className="text-xs text-muted-foreground">Define your product requirements</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-purple/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <GitBranch className="w-4 h-4 text-brand-purple" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Define User Flows</h3>
              <p className="text-xs text-muted-foreground">Map out user journeys</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-purple/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Kanban className="w-4 h-4 text-brand-purple" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Track Development</h3>
              <p className="text-xs text-muted-foreground">Manage features & tasks</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold">Your Products</h2>
        <Button
          onClick={() => navigate('/product/new')}
          className="flex items-center gap-2 bg-brand-purple hover:bg-brand-purple-dark w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          New Product
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-8 md:py-12 bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
          <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No products yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first product to get started with PRD generation.
          </p>
          <Button
            onClick={() => navigate('/product/new')}
            className="flex items-center gap-2 mx-auto bg-brand-purple hover:bg-brand-purple-dark"
          >
            <Plus className="w-4 h-4" />
            Create First Product
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 
                  className="text-lg font-semibold cursor-pointer hover:text-brand-purple"
                  onClick={() => handleProductSelect(product)}
                >
                  {product.name}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProductToDelete(product);
                  }}
                  className="ml-2 hover:bg-muted"
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
              <div className="mb-4 cursor-pointer" onClick={() => handleProductSelect(product)}>
                <ProductDescription description={product.description} className="text-sm text-muted-foreground" />
              </div>
              <div className="text-sm text-muted-foreground">
                Created {new Date(product.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setProductToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProduct}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}