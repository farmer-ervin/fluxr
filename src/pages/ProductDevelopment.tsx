import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  BarChart, 
  FileText, 
  GitBranch, 
  Bug, 
  Check, 
  Clock, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Kanban
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { cn, stripHtml } from '@/lib/utils';
import { useProduct } from '@/components/context/ProductContext';

interface Product {
  id: string;
  name: string;
  description: string;
  slug: string;
  created_at: string;
}

interface ProductWithMetrics extends Product {
  hasPrd: boolean;
  hasUserFlows: boolean;
  flowsCount: number;
  featuresStats: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    completionPercentage: number;
  };
  bugsStats: {
    total: number;
    open: number;
    fixed: number;
  };
}

export function ProductDevelopment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentProduct, setCurrentProduct } = useProduct();
  const [products, setProducts] = useState<ProductWithMetrics[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'progress'>('newest');

  // Store current product in localStorage when visiting this page
  useEffect(() => {
    if (currentProduct) {
      const storedProduct = localStorage.getItem('previous_product_context');
      const productToStore = {
        id: currentProduct.id,
        name: currentProduct.name,
        description: currentProduct.description,
        slug: currentProduct.slug
      };
      
      // Only update localStorage if the product has changed
      if (!storedProduct || JSON.parse(storedProduct).slug !== currentProduct.slug) {
        localStorage.setItem('previous_product_context', JSON.stringify(productToStore));
      }
    }
  }, [currentProduct]);

  useEffect(() => {
    async function fetchProductsWithMetrics() {
      try {
        setLoading(true);
        
        // First, fetch all products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;
        
        if (!productsData || productsData.length === 0) {
          setProducts([]);
          setFilteredProducts([]);
          return;
        }

        // Fetch metrics for each product
        const productsWithMetrics = await Promise.all(
          productsData.map(async (product) => {
            // Check if PRD exists
            const { data: prdData } = await supabase
              .from('prds')
              .select('id')
              .eq('product_id', product.id)
              .maybeSingle();

            // Check user flows
            const { data: flowPagesData, count: flowPagesCount } = await supabase
              .from('flow_pages')
              .select('id', { count: 'exact' })
              .eq('product_id', product.id);

            // Get feature statistics
            const { data: featuresData } = await supabase
              .from('features')
              .select('implementation_status')
              .eq('product_id', product.id);

            // Get bugs statistics
            const { data: bugsData } = await supabase
              .from('bugs')
              .select('status')
              .eq('product_id', product.id);

            // Calculate feature metrics
            const featuresTotal = featuresData?.length || 0;
            const featuresCompleted = featuresData?.filter(f => f.implementation_status === 'completed')?.length || 0;
            const featuresInProgress = featuresData?.filter(f => 
              f.implementation_status === 'in_progress' || f.implementation_status === 'in_review')?.length || 0;
            const featuresNotStarted = featuresData?.filter(f => f.implementation_status === 'not_started')?.length || 0;
            
            // Calculate bug metrics
            const bugsTotal = bugsData?.length || 0;
            const bugsFixed = bugsData?.filter(b => b.status === 'completed')?.length || 0;
            const bugsOpen = bugsTotal - bugsFixed;

            // Return enhanced product object with metrics
            return {
              ...product,
              hasPrd: !!prdData,
              hasUserFlows: !!flowPagesCount && flowPagesCount > 0,
              flowsCount: flowPagesCount || 0,
              featuresStats: {
                total: featuresTotal,
                completed: featuresCompleted,
                inProgress: featuresInProgress,
                notStarted: featuresNotStarted,
                completionPercentage: featuresTotal > 0 ? Math.round((featuresCompleted / featuresTotal) * 100) : 0
              },
              bugsStats: {
                total: bugsTotal,
                fixed: bugsFixed,
                open: bugsOpen
              }
            };
          })
        );

        setProducts(productsWithMetrics);
        setFilteredProducts(productsWithMetrics);
      } catch (err) {
        console.error('Error fetching products data:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchProductsWithMetrics();
  }, []);

  // Filter and sort products when search or sort changes
  useEffect(() => {
    let filtered = [...products];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stripHtml(product.description).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply sorting
    switch(sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'progress':
        filtered.sort((a, b) => b.featuresStats.completionPercentage - a.featuresStats.completionPercentage);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }
    
    setFilteredProducts(filtered);
  }, [searchQuery, sortBy, products]);

  const getOverallProgress = () => {
    const totalFeatures = products.reduce((sum, product) => sum + product.featuresStats.total, 0);
    const completedFeatures = products.reduce((sum, product) => sum + product.featuresStats.completed, 0);
    return totalFeatures > 0 ? Math.round((completedFeatures / totalFeatures) * 100) : 0;
  };

  // Helper function to navigate to a product route and set the current product
  const navigateToProduct = (product: ProductWithMetrics, route: string) => {
    setCurrentProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      slug: product.slug
    });
    navigate(`/product/${product.slug}${route}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Product Development</h1>
            <p className="text-muted-foreground mt-1">Manage and track the development of all your products</p>
          </div>
          <Button 
            onClick={() => navigate('/product/new')} 
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="h-4 w-4" />
            Create New Product
          </Button>
        </div>

        {/* Dashboard Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border">
            <CardContent className="pt-6">
              <h3 className="text-base font-normal text-muted-foreground">Total Products</h3>
              <p className="text-3xl font-semibold mt-1">{products.length}</p>
            </CardContent>
          </Card>
          
          <Card className="border">
            <CardContent className="pt-6 space-y-2">
              <h3 className="text-base font-normal text-muted-foreground">Overall Progress</h3>
              <p className="text-3xl font-semibold">{getOverallProgress()}%</p>
              <Progress value={getOverallProgress()} className="h-2 bg-primary/10" />
            </CardContent>
          </Card>
          
          <Card className="border">
            <CardContent className="pt-6">
              <h3 className="text-base font-normal text-muted-foreground">Open Bugs</h3>
              <p className="text-3xl font-semibold mt-1">
                {products.reduce((sum, product) => sum + product.bugsStats.open, 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filtering */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-72">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 border rounded-md"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
            <div className="flex border rounded-md overflow-hidden">
              <Button
                variant={sortBy === 'newest' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "rounded-none h-10 px-4",
                  sortBy === 'newest' && "bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
                )}
                onClick={() => setSortBy('newest')}
              >
                Newest
              </Button>
              <Button
                variant={sortBy === 'oldest' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "rounded-none h-10 px-4",
                  sortBy === 'oldest' && "bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
                )}
                onClick={() => setSortBy('oldest')}
              >
                Oldest
              </Button>
              <Button
                variant={sortBy === 'progress' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "rounded-none h-10 px-4",
                  sortBy === 'progress' && "bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
                )}
                onClick={() => setSortBy('progress')}
              >
                Progress
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-12 bg-muted/40 rounded-lg">
            <div className="bg-background rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4 shadow">
              <BarChart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {products.length === 0 
                ? "You haven't created any products yet. Create your first product to get started."
                : "No products match your search criteria. Try adjusting your filters."}
            </p>
            {products.length === 0 && (
              <Button
                onClick={() => navigate('/product/new')}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Create First Product
              </Button>
            )}
          </div>
        )}

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden transition-all border hover:shadow-sm">
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <CardTitle className="line-clamp-1 text-xl">
                      <Link 
                        to={`/product/${product.slug}/prd`} 
                        className="hover:underline cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          navigateToProduct(product, '/prd');
                        }}
                      >
                        {product.name}
                      </Link>
                    </CardTitle>
                  </div>
                  <CardDescription className="line-clamp-2 mb-4 text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {stripHtml(product.description) || "No description provided"}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pb-0 pt-0 space-y-4">
                  {/* Document Status */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-medium">PRD:</span>
                      {product.hasPrd ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700">
                          Complete
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50 hover:text-amber-700">
                          Missing
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-medium">Flows:</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700">
                        {product.flowsCount}
                      </Badge>
                    </div>
                  </div>

                  {/* Feature Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Development Progress</span>
                      <span className="text-sm font-medium">{product.featuresStats.completionPercentage}%</span>
                    </div>
                    <Progress value={product.featuresStats.completionPercentage} className="h-2 bg-primary/10" />
                    <div className="text-xs text-gray-500 py-1">
                      {product.featuresStats.completed}/{product.featuresStats.total} features
                    </div>
                  </div>
                </CardContent>
                
                <CardContent className="py-2">
                  <div className="flex w-full gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="flex-1 border"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateToProduct(product, '/prd');
                      }}
                    >
                      <FileText className="mr-1.5 h-3.5 w-3.5" />
                      PRD
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="flex-1 border"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateToProduct(product, '/flows');
                      }}
                    >
                      <GitBranch className="mr-1.5 h-3.5 w-3.5" />
                      Flows
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="flex-1 border"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateToProduct(product, '/development');
                      }}
                    >
                      <Kanban className="mr-1.5 h-3.5 w-3.5" />
                      Dev
                    </Button>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between pt-0 pb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateToProduct(product, '/prd');
                    }}
                  >
                    View Details
                  </Button>
                  <div className="text-xs text-gray-500">
                    Updated {new Date(product.updated_at || product.created_at).toLocaleDateString()}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 