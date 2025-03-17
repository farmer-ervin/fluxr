import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PromptCard } from '@/components/prompts/PromptCard';
import { PromptForm } from '@/components/prompts/PromptForm';
import { supabase, handleSupabaseError } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { Loader2, Plus, Filter, Globe, AlertTriangle } from 'lucide-react';

interface PromptTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string;
  template: string;
  category: string;
  created_at: string;
  is_public?: boolean;
}

interface ProductPrompt {
  id: string;
  product_id: string;
  template_id: string | null;
  name: string;
  description: string;
  prompt: string;
  created_at: string;
}

type CategoryType = 'all' | 'first' | 'system' | 'page' | 'feature' | 'debugging' | 'database' | 'authentication';
type ToolType = 'all' | 'replit' | 'v0' | 'bolt';

export function PromptLibrary() {
  const { user } = useAuth();
  const { productSlug } = useParams();
  const [personalPrompts, setPersonalPrompts] = useState<PromptTemplate[]>([]);
  const [communityPrompts, setCommunityPrompts] = useState<PromptTemplate[]>([]);
  const [productPrompts, setProductPrompts] = useState<ProductPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPromptForm, setShowPromptForm] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [selectedProductPrompt, setSelectedProductPrompt] = useState<ProductPrompt | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<{
    type: 'personal' | 'product';
    data: PromptTemplate | ProductPrompt | null;
  } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryType>('all');
  const [toolFilter, setToolFilter] = useState<ToolType>('all');
  const [productId, setProductId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState(productSlug ? 'product' : 'personal');
  const [isOffline, setIsOffline] = useState(false);
  const [isAddingToProduct, setIsAddingToProduct] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);

  // Check for network status changes
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial state
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    async function loadPrompts() {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);

        // Get product ID if productSlug is available
        if (productSlug) {
          try {
            const { data: product, error: productError } = await supabase
              .from('products')
              .select('id')
              .eq('slug', productSlug)
              .single();

            if (productError) throw productError;
            setProductId(product.id);

            // Load product-specific prompts
            const { data: productPromptsData, error: productPromptsError } = await supabase
              .from('product_prompts')
              .select('*')
              .eq('product_id', product.id)
              .order('created_at', { ascending: false });

            if (productPromptsError) throw productPromptsError;
            setProductPrompts(productPromptsData || []);
          } catch (error) {
            console.error('Error loading product prompts:', error);
            // Don't set the error state here to avoid blocking the entire page
            // if only product-specific prompts fail to load
          }
        }

        // Load personal prompts
        try {
          const { data: personalPromptsData, error: personalPromptsError } = await supabase
            .from('prompt_templates')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (personalPromptsError) throw personalPromptsError;
          setPersonalPrompts(personalPromptsData || []);
        } catch (error) {
          console.error('Error loading personal prompts:', error);
          throw error; // Re-throw to be caught by the main catch block
        }

        // Load community 
        // Load community prompts with better error handling
        try {
          // Only try to load community prompts if user is online
          if (navigator.onLine) {
            const { data: communityPromptsData, error: communityPromptsError } = await supabase
              .from('prompt_templates')
              .select('*')
              .eq('is_public', true)
              .order('created_at', { ascending: false });

            if (communityPromptsError) throw communityPromptsError;
            setCommunityPrompts(communityPromptsData || []);
          } else {
            // If offline, keep existing community prompts or set to empty array
            setCommunityPrompts(prev => prev.length > 0 ? prev : []);
          }
        } catch (error) {
          console.error('Error loading community prompts:', error);
          // Don't abort the entire loading process for community prompts failure
          // Just show an empty list with an error message
          setCommunityPrompts([]);
        }
      } catch (error) {
        console.error('Error loading prompts:', error);
        setError(handleSupabaseError(error).message);
      } finally {
        setLoading(false);
      }
    }

    loadPrompts();
  }, [user, productSlug, refreshTrigger]);

  useEffect(() => {
    // Set active tab to 'product' when productId becomes available
    if (productId && activeTab !== 'product') {
      setActiveTab('product');
    }
  }, [productId]);

  // Debug selectedPrompt state changes
  useEffect(() => {
    console.log('selectedPrompt changed:', selectedPrompt?.id);
  }, [selectedPrompt]);

  // Debug selectedProductPrompt state changes
  useEffect(() => {
    console.log('selectedProductPrompt changed:', selectedProductPrompt?.id);
  }, [selectedProductPrompt]);

  // Debug showPromptForm state changes
  useEffect(() => {
    console.log('showPromptForm changed:', showPromptForm);
  }, [showPromptForm]);

  // Debug editingPrompt state changes
  useEffect(() => {
    console.log('editingPrompt changed:', editingPrompt?.type, editingPrompt?.data?.id);
  }, [editingPrompt]);

  const handleCreatePrompt = async (prompt: Partial<PromptTemplate>) => {
    if (!user) return;

    try {
      setError(null);

      // If we're adding to product, save to product_prompts table
      if (editingPrompt?.type === 'product' && productId) {
        const newProductPrompt = {
          product_id: productId,
          template_id: null, // Not based on an existing template
          name: prompt.name,
          description: prompt.description,
          prompt: prompt.template
        };

        const { data, error: insertError } = await supabase
          .from('product_prompts')
          .insert(newProductPrompt)
          .select()
          .single();

        if (insertError) throw insertError;

        setProductPrompts(prev => [data, ...prev]);
        setEditingPrompt(null);
        
        // Show success message
        setSuccessMessage(`"${prompt.name}" added to product prompts`);
        setTimeout(() => setSuccessMessage(null), 3000);
        
        return;
      }

      // Otherwise save to personal prompts
      const newPrompt = {
        ...prompt,
        user_id: user.id,
        is_public: prompt.is_public || false
      };

      const { data, error: insertError } = await supabase
        .from('prompt_templates')
        .insert(newPrompt)
        .select()
        .single();

      if (insertError) throw insertError;

      setPersonalPrompts(prev => [data, ...prev]);
      setEditingPrompt(null);
      
      // Show success message for new prompt
      if (data.is_public) {
        setSuccessMessage(`"${data.name}" has been created and shared with the community`);
      } else {
        setSuccessMessage(`"${data.name}" has been created`);
      }
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh community prompts if this prompt is public
      if (data.is_public) {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error creating prompt:', error);
      setError(handleSupabaseError(error).message);
    }
  };

  const handleUpdatePrompt = async (prompt: Partial<PromptTemplate>) => {
    try {
      setError(null);

      if (!prompt.id) {
        throw new Error("Missing prompt ID");
      }

      // Find the original prompt to compare if public status changed
      const originalPrompt = personalPrompts.find(p => p.id === prompt.id) || 
                            communityPrompts.find(p => p.id === prompt.id);
      
      if (!originalPrompt) {
        throw new Error("Prompt not found");
      }
      
      const publicStatusChanged = originalPrompt.is_public !== prompt.is_public;
      const isInCommunityTab = activeTab === 'community';

      const updateData: Record<string, any> = {
        name: prompt.name,
        description: prompt.description,
        template: prompt.template,
        category: prompt.category,
        is_public: prompt.is_public
      };

      const { error: updateError } = await supabase
        .from('prompt_templates')
        .update(updateData)
        .eq('id', prompt.id);

      if (updateError) throw updateError;

      // Update the prompt in the local state
      setPersonalPrompts(prev => 
        prev.map(p => p.id === prompt.id ? { ...p, ...updateData } as PromptTemplate : p)
      );
      
      // Also update in community prompts if it exists there
      setCommunityPrompts(prev => 
        prev.map(p => p.id === prompt.id ? { ...p, ...updateData } as PromptTemplate : p)
      );
      
      setEditingPrompt(null);
      
      // Show success message
      if (publicStatusChanged) {
        if (prompt.is_public) {
          setSuccessMessage(`"${prompt.name}" is now shared with the community`);
        } else {
          setSuccessMessage(`"${prompt.name}" is no longer shared with the community`);
        }
      } else {
        setSuccessMessage(`"${prompt.name}" has been updated`);
      }
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh community prompts if the visibility changed
      if (publicStatusChanged) {
        setRefreshTrigger(prev => prev + 1);
      }
      
      // If we were editing from the community tab, stay there
      if (isInCommunityTab && prompt.is_public) {
        setActiveTab('community');
      } else {
        setActiveTab('personal');
      }
    } catch (error) {
      console.error('Error updating prompt:', error);
      setError(handleSupabaseError(error).message);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    try {
      setError(null);

      // Check if the prompt is public before deleting
      const promptToDelete = personalPrompts.find(p => p.id === id);
      const isPublic = promptToDelete?.is_public;

      const { error: deleteError } = await supabase
        .from('prompt_templates')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setPersonalPrompts(prev => prev.filter(p => p.id !== id));
      
      // Refresh community tab if a public prompt was deleted
      if (isPublic) {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
      setError(handleSupabaseError(error).message);
    }
  };

  const handleTogglePublic = async (prompt: PromptTemplate) => {
    try {
      setError(null);
      
      const newIsPublic = !prompt.is_public;
      
      const { error: updateError } = await supabase
        .from('prompt_templates')
        .update({ is_public: newIsPublic })
        .eq('id', prompt.id);
        
      if (updateError) throw updateError;
      
      // Update local state
      setPersonalPrompts(prev => 
        prev.map(p => p.id === prompt.id 
          ? { ...p, is_public: newIsPublic } 
          : p
        )
      );
      
      // Show success message
      if (newIsPublic) {
        setSuccessMessage(`"${prompt.name}" is now shared with the community`);
      } else {
        setSuccessMessage(`"${prompt.name}" is no longer shared with the community`);
      }
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh community prompts list
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error toggling prompt visibility:', error);
      setError(handleSupabaseError(error).message);
    }
  };

  const handleSaveToProduct = async (prompt: PromptTemplate) => {
    if (!productId) return;

    try {
      setError(null);

      // Check if the prompt is already in the product library
      const { data: existingPrompts, error: checkError } = await supabase
        .from('product_prompts')
        .select('id')
        .eq('product_id', productId)
        .eq('template_id', prompt.id);

      if (checkError) throw checkError;

      if (existingPrompts && existingPrompts.length > 0) {
        setError("This prompt is already in the product library");
        return;
      }

      const newProductPrompt = {
        product_id: productId,
        template_id: prompt.id,
        name: prompt.name,
        description: prompt.description,
        prompt: prompt.template
      };

      const { data, error: insertError } = await supabase
        .from('product_prompts')
        .insert(newProductPrompt)
        .select()
        .single();

      if (insertError) throw insertError;

      setProductPrompts(prev => [data, ...prev]);
      
      // Show success message
      setSuccessMessage(`"${prompt.name}" added to product prompts`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Switch to product tab
      setActiveTab('product');
    } catch (error) {
      console.error('Error saving prompt to product:', error);
      setError(handleSupabaseError(error).message);
    }
  };

  const handleDeleteProductPrompt = async (id: string) => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('product_prompts')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setProductPrompts(prev => prev.filter(p => p.id !== id));
      
      // Show success message
      setSuccessMessage("Product prompt deleted successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting product prompt:', error);
      setError(handleSupabaseError(error).message);
    }
  };

  const handleUpdateProductPrompt = async (prompt: Partial<PromptTemplate>) => {
    console.log('handleUpdateProductPrompt called with:', prompt);
    try {
      setError(null);

      if (!prompt.id) {
        throw new Error("Missing prompt ID");
      }

      // Map the fields correctly - the form uses 'template' but product_prompts uses 'prompt'
      const updateData = {
        name: prompt.name,
        description: prompt.description,
        prompt: prompt.template // Map template field from form to prompt field in database
      };
      
      console.log('Updating product prompt with data:', updateData);

      const { error: updateError } = await supabase
        .from('product_prompts')
        .update(updateData)
        .eq('id', prompt.id);

      if (updateError) throw updateError;

      // Update the prompt in the local state - ensure correct field mapping
      setProductPrompts(prev => 
        prev.map(p => p.id === prompt.id ? { 
          ...p, 
          name: updateData.name || p.name,
          description: updateData.description || p.description,
          prompt: updateData.prompt || p.prompt
        } as ProductPrompt : p)
      );
      
      setEditingPrompt(null);
      
      // Show success message
      setSuccessMessage("Product prompt updated successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error updating product prompt:', error);
      setError(handleSupabaseError(error).message);
    }
  };

  const handleSaveToPersonal = async (prompt: PromptTemplate) => {
    if (!user) return;

    try {
      setError(null);

      // Check if a similar prompt already exists in the personal library
      const { data: existingPrompts, error: checkError } = await supabase
        .from('prompt_templates')
        .select('id')
        .eq('user_id', user.id)
        .eq('template', prompt.template);

      if (checkError) throw checkError;

      if (existingPrompts && existingPrompts.length > 0) {
        setError("A similar prompt already exists in your personal library");
        return;
      }

      // Create a new personal prompt based on the community prompt
      const newPrompt = {
        user_id: user.id,
        name: `${prompt.name} (Saved)`,
        description: prompt.description,
        template: prompt.template,
        category: prompt.category,
        is_public: false
      };

      const { data, error: insertError } = await supabase
        .from('prompt_templates')
        .insert(newPrompt)
        .select()
        .single();

      if (insertError) throw insertError;

      // Add to personal prompts
      setPersonalPrompts(prev => [data, ...prev]);
      
      // Show success message
      setSuccessMessage(`"${prompt.name}" saved to your personal library`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Switch to personal tab
      setActiveTab('personal');
    } catch (error) {
      console.error('Error saving to personal library:', error);
      setError(handleSupabaseError(error).message);
    }
  };

  // Helper function to check if a prompt is already in the product library
  const isPromptInProductLibrary = (promptId: string): boolean => {
    return productPrompts.some(p => p.template_id === promptId);
  };

  const filteredPersonalPrompts = personalPrompts.filter(prompt => {
    if (categoryFilter !== 'all' && prompt.category !== categoryFilter) {
      return false;
    }
    return true;
  });

  const filteredCommunityPrompts = communityPrompts.filter(prompt => {
    if (categoryFilter !== 'all' && prompt.category !== categoryFilter) {
      return false;
    }
    return true;
  });

  const handleDuplicatePrompt = async (prompt: PromptTemplate) => {
    if (!user) return;

    try {
      setError(null);

      // Create a new prompt based on the existing one
      const newPrompt = {
        user_id: user.id,
        name: `${prompt.name} (Copy)`,
        description: prompt.description,
        template: prompt.template,
        category: prompt.category,
        is_public: false // Always create as private initially
      };

      const { data, error: insertError } = await supabase
        .from('prompt_templates')
        .insert(newPrompt)
        .select()
        .single();

      if (insertError) throw insertError;

      // Add to personal prompts
      setPersonalPrompts(prev => [data, ...prev]);
      
      // Show success message
      setSuccessMessage(`"${prompt.name}" has been duplicated to your personal library`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Switch to personal tab
      setActiveTab('personal');
    } catch (error) {
      console.error('Error duplicating prompt:', error);
      setError(handleSupabaseError(error).message);
    }
  };

  const handleDuplicateProductPrompt = async (productPrompt: ProductPrompt) => {
    if (!user) return;

    try {
      setError(null);

      // Create a new personal prompt based on the product prompt
      const newPrompt = {
        user_id: user.id,
        name: `${productPrompt.name} (Copy)`,
        description: productPrompt.description,
        template: productPrompt.prompt,
        category: 'system', // Default category
        is_public: false // Always create as private initially
      };

      const { data, error: insertError } = await supabase
        .from('prompt_templates')
        .insert(newPrompt)
        .select()
        .single();

      if (insertError) throw insertError;

      // Add to personal prompts
      setPersonalPrompts(prev => [data, ...prev]);
      
      // Show success message
      setSuccessMessage(`"${productPrompt.name}" has been duplicated to your personal library`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Switch to personal tab
      setActiveTab('personal');
    } catch (error) {
      console.error('Error duplicating product prompt:', error);
      setError(handleSupabaseError(error).message);
    }
  };

  const filterPromptsByCategory = (prompt: PromptTemplate): boolean => {
    if (categoryFilter === 'all') return true;
    return prompt.category === categoryFilter;
  };

  const filterProductPromptsByCategory = (prompt: ProductPrompt): boolean => {
    if (categoryFilter === 'all') return true;
    return prompt.template.includes(categoryFilter);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-purple mx-auto mb-4" />
          <p className="text-gray-600">Loading prompts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PageTitle title="Prompt Library" />
      
      {isOffline && (
        <div className="bg-yellow-50 p-4 mb-6 rounded-lg border border-yellow-200 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-700 flex-shrink-0" />
          <p className="text-yellow-700">You are currently offline. Some features may not be available.</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Prompt Library</h1>
        
        <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowPromptForm(true);
              setSelectedPrompt(null);
              setEditingPrompt(null);
            }}
            className="w-full xs:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Prompt
          </Button>
          
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center w-full xs:w-auto"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {filtersApplied ? <span className="bg-brand-purple text-white rounded-full h-4 w-4 flex items-center justify-center text-xs absolute -top-1 -right-1">!</span> : null}
              Filter
            </Button>
            
            {showFilters && (
              <div className="absolute top-full right-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-64">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Category</h3>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value as CategoryType)}
                      className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
                    >
                      <option value="all">All Categories</option>
                      <option value="system">System Prompts</option>
                      <option value="page">Page Design</option>
                      <option value="feature">Feature Design</option>
                      <option value="debugging">Debugging</option>
                      <option value="database">Database</option>
                      <option value="authentication">Authentication</option>
                      <option value="first">First-party</option>
                    </select>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Tool</h3>
                    <select
                      value={toolFilter}
                      onChange={(e) => setToolFilter(e.target.value as ToolType)}
                      className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
                    >
                      <option value="all">All Tools</option>
                      <option value="replit">Replit</option>
                      <option value="v0">V0</option>
                      <option value="bolt">Bolt</option>
                    </select>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full" 
                    onClick={() => {
                      setCategoryFilter('all');
                      setToolFilter('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 mb-6 rounded-lg border border-red-200 flex items-center gap-2">
          <div className="h-5 w-5 text-red-700 flex items-center justify-center">⚠️</div>
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 p-4 mb-6 rounded-lg border border-green-200 flex items-center gap-2">
          <div className="h-5 w-5 text-green-700 flex items-center justify-center">✓</div>
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="flex flex-col space-y-8"
      >
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger 
            value="personal"
            className="flex-1 sm:flex-initial"
          >
            Personal Library
          </TabsTrigger>
          
          <TabsTrigger 
            value="community"
            className="flex-1 sm:flex-initial"
          >
            <Globe className="h-4 w-4 mr-2" />
            Community Prompts
          </TabsTrigger>
          
          {productSlug && (
            <TabsTrigger 
              value="product"
              className="flex-1 sm:flex-initial"
            >
              Product Prompts
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="personal" className="space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
            </div>
          ) : personalPrompts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium mb-2">No personal prompts yet</h3>
              <p className="text-gray-600 mb-4">Create your first prompt to get started</p>
              <Button
                onClick={() => {
                  setShowPromptForm(true);
                  setSelectedPrompt(null);
                  setEditingPrompt(null);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Prompt
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personalPrompts
                .filter(filterPromptsByCategory)
                .map(prompt => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    type="personal"
                    onEdit={() => handleEditPrompt('personal', prompt)}
                    onDelete={() => handleDeletePrompt(prompt.id)}
                    onTogglePublic={() => handleTogglePublic(prompt)}
                    onSaveToProduct={productId ? () => handleSaveToProduct(prompt) : undefined}
                    isInProductLibrary={productId ? isPromptInProductLibrary(prompt.id) : false}
                    onDuplicate={() => handleDuplicatePrompt(prompt)}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="community" className="space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
            </div>
          ) : communityPrompts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium mb-2">No community prompts available</h3>
              <p className="text-gray-600 mb-4">Be the first to share your prompts with the community!</p>
              <Button
                onClick={() => {
                  setShowPromptForm(true);
                  setSelectedPrompt(null);
                  setEditingPrompt(null);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Prompt
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {communityPrompts
                .filter(filterPromptsByCategory)
                .map(prompt => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    type="community"
                    onDuplicate={() => handleDuplicatePrompt(prompt)}
                    onSaveToProduct={productId ? () => handleSaveToProduct(prompt) : undefined}
                    isInProductLibrary={productId ? isPromptInProductLibrary(prompt.id) : false}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        {productSlug && (
          <TabsContent value="product" className="space-y-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
              </div>
            ) : productPrompts.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium mb-2">No product prompts yet</h3>
                <p className="text-gray-600 mb-4">Add prompts specific to this product</p>
                <Button
                  onClick={() => {
                    setShowPromptForm(true);
                    setSelectedPrompt(null);
                    setEditingPrompt(null);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Product Prompt
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productPrompts
                  .filter(filterProductPromptsByCategory)
                  .map(productPrompt => (
                    <PromptCard
                      key={productPrompt.id}
                      prompt={productPrompt}
                      type="product"
                      onEdit={() => handleEditProductPrompt(productPrompt)}
                      onDelete={() => handleDeleteProductPrompt(productPrompt.id)}
                      onSaveToPersonal={() => handleSaveToPersonal(productPrompt as unknown as PromptTemplate)}
                      onDuplicate={() => handleDuplicateProductPrompt(productPrompt)}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {editingPrompt && (
        editingPrompt.type === 'personal' ? (
          <PromptForm
            prompt={editingPrompt.data as PromptTemplate}
            onSave={editingPrompt.data ? handleUpdatePrompt : handleCreatePrompt}
            onCancel={() => setEditingPrompt(null)}
            isAddingToProduct={false}
            isEditingCommunityPrompt={(editingPrompt.data as PromptTemplate)?.is_public || false}
          />
        ) : (
          editingPrompt.data && (
            <>
              {console.log('Rendering PromptForm for product prompt:', editingPrompt.data)}
              <PromptForm
                prompt={editingPrompt.data ? {
                  id: (editingPrompt.data as ProductPrompt).id,
                  user_id: user?.id || '',
                  name: (editingPrompt.data as ProductPrompt).name,
                  description: (editingPrompt.data as ProductPrompt).description,
                  template: (editingPrompt.data as ProductPrompt).prompt,
                  category: 'system',
                  created_at: (editingPrompt.data as ProductPrompt).created_at
                } : null}
                onSave={editingPrompt.data ? handleUpdateProductPrompt : handleCreatePrompt}
                onCancel={() => setEditingPrompt(null)}
                isAddingToProduct={true}
              />
            </>
          )
        )
      )}
    </div>
  );
}