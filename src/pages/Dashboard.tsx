import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Trash2, Rocket, Settings, Users, FileCheck } from 'lucide-react';
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

  const getFirstName = () => {
    const fullName = user?.user_metadata?.full_name;
    if (!fullName) return 'there';  // Default fallback if no name is set
    return fullName.split(' ')[0];  // Get the first name
  };

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
        title={`Welcome, ${getFirstName()}!`}
        description="Manage your product development process"
      />

      {/* Product Development Steps */}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-base font-medium">Create/Upload PRD</h4>
                  <p className="text-sm text-muted-foreground">Define your product requirements</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-base font-medium">Generate User Flows</h4>
                  <p className="text-sm text-muted-foreground">Map out user journeys</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <FileCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-base font-medium">Track Development</h4>
                  <p className="text-sm text-muted-foreground">Manage features & tasks</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

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
              variant="default"
              onClick={() => navigate('/product/create')}
              className="mx-auto"
            >
              Create Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid-cards">
          {products.map((product) => (
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