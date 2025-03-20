import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Trash2, Rocket, Settings, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useProduct } from '@/components/context/ProductContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProductDescription } from '@/components/ProductDescription';
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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
  const [searchQuery, setSearchQuery] = useState('');

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
      toast.success('Product deleted successfully');
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    navigate('/');
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title={`Welcome, ${user?.email}`}
        description="Manage your product development process"
      />

      {/* Ship It Demo Card */}
      <section className="section-space">
        <Card className="ship-it-card">
          <div className="flex-stack">
            <div className="flex-between">
              <h3 className="heading-xl">Track your progress across tools</h3>
              <div className="icon-container">
                <Rocket className="icon-lg" />
              </div>
            </div>
            <p className="section-description">
              Stay focused on your goals, and launch your product faster than ever.
            </p>
            <div className="tip-card">
              <p className="tip-text">
                <span className="tip-label">Pro Tip:</span> 
                Create your first product to get started
              </p>
            </div>
          </div>
        </Card>
      </section>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="search-container w-full sm:w-64">
          <Search className="search-icon" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {error && (
        toast.error(error)
      )}

      {products.length === 0 ? (
        <Card className="flex-1 text-center py-8 md:py-12">
          <CardContent className="pt-6">
            <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first product to get started with PRD generation.
            </p>
            <Button
              onClick={() => navigate('/product/create')}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="icon-button" />
              Create Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid-cards">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover-blue">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle 
                      className="cursor-pointer hover:text-primary"
                      onClick={() => handleProductSelect(product)}
                    >
                      {product.name}
                    </CardTitle>
                    <CardDescription>
                      Created {new Date(product.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProductToDelete(product);
                    }}
                    className="table-action-button"
                  >
                    <Trash2 className="table-action-icon text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="cursor-pointer mb-4"
                  onClick={() => handleProductSelect(product)}
                >
                  <ProductDescription description={product.description} className="text-sm text-muted-foreground" />
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    <Settings className="icon-button mr-1" />
                    Settings
                  </Badge>
                </div>
              </CardContent>
            </Card>
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