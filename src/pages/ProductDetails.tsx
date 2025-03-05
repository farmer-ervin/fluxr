import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/PageTitle';

interface ProductForm {
  name: string;
  description: string;
}

export function ProductDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not accessed through /product/new
  React.useEffect(() => {
    if (location.pathname !== '/product/new') {
      navigate('/');
    }
  }, [location.pathname, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate form
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create the product and get its slug
      const { data, error } = await supabase
        .rpc('create_product', {
          user_id: user.id,
          product_name: formData.name,
          product_description: formData.description
        });

      if (error) throw error;
      if (!data) throw new Error('No data returned from the server');

      // Get the product's slug
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('slug')
        .eq('id', data)
        .single();

      if (productError) throw productError;
      if (!productData?.slug) throw new Error('Product slug not found');

      // Navigate to the PRD editor using the slug
      navigate(`/product/${productData.slug}/prd`);
    } catch (err) {
      console.error('Error creating product:', err);
      setError('Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageTitle title="Create New Product" />

      <button
        onClick={() => navigate('/')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>

      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Product</h2>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
              placeholder="Enter product name"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Product Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
              placeholder="Brief description of your product"
              disabled={loading}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}