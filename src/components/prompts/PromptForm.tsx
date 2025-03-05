import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { X, Save, Globe, BookmarkPlus } from 'lucide-react';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  category: string;
  is_public?: boolean;
}

interface PromptFormProps {
  prompt?: PromptTemplate | null;
  onSave: (prompt: Partial<PromptTemplate>) => void;
  onCancel: () => void;
  isAddingToProduct?: boolean;
  isEditingCommunityPrompt?: boolean;
}

export function PromptForm({ 
  prompt, 
  onSave, 
  onCancel, 
  isAddingToProduct = false,
  isEditingCommunityPrompt = false
}: PromptFormProps) {
  console.log('PromptForm rendered with prompt:', prompt);
  console.log('isAddingToProduct:', isAddingToProduct);
  console.log('isEditingCommunityPrompt:', isEditingCommunityPrompt);
  
  const [formData, setFormData] = useState({
    name: prompt?.name || '',
    description: prompt?.description || '',
    template: prompt?.template || '',
    category: prompt?.category || 'system',
    is_public: prompt?.is_public || false
  });
  
  console.log('Initial form data:', formData);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.template.trim()) {
      newErrors.template = 'Prompt template is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const promptData = {
      ...formData,
      id: prompt?.id
    };
    
    console.log('PromptForm submitting with data:', promptData);
    console.log('Is this a product prompt?', isAddingToProduct);
    
    onSave(promptData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {prompt 
              ? isAddingToProduct 
                ? 'Edit Product Prompt' 
                : isEditingCommunityPrompt
                  ? 'Edit Community Prompt'
                  : 'Edit Prompt' 
              : isAddingToProduct 
                ? 'Create New Product Prompt' 
                : 'Create New Prompt'
            }
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isAddingToProduct && (
            <div className="bg-blue-50 p-3 rounded-md mb-4 text-sm text-blue-700 flex items-center gap-2">
              <BookmarkPlus className="h-4 w-4" />
              <span>
                {prompt 
                  ? 'You are editing a prompt in the product library.' 
                  : 'This prompt will be added directly to the product prompt library.'
                }
              </span>
            </div>
          )}
          
          {isEditingCommunityPrompt && (
            <div className="bg-green-50 p-3 rounded-md mb-4 text-sm text-green-700 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>
                You are editing a prompt that is shared with the community.
              </span>
            </div>
          )}
          <div>
            <Label htmlFor="name">Prompt Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent"
            >
              <option value="first">First Prompts</option>
              <option value="system">System Prompts</option>
              <option value="page">Page Prompts</option>
              <option value="feature">Feature Prompts</option>
              <option value="debugging">Debugging Prompts</option>
              <option value="database">Database Prompts</option>
              <option value="authentication">Authentication Prompts</option>
            </select>
          </div>
          
          <div>
            <Label htmlFor="template">Prompt Template</Label>
            <div className="mb-2">
              <span className="text-xs text-gray-500">
                Use natural language with clear instructions. You can include placeholders like {'{product_name}'} or {'{user_goal}'}.
              </span>
            </div>
            <Textarea
              id="template"
              name="template"
              value={formData.template}
              onChange={handleChange}
              rows={10}
              className={errors.template ? 'border-red-500' : ''}
              placeholder="Write your prompt template here..."
            />
            {errors.template && (
              <p className="text-sm text-red-500 mt-1">{errors.template}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!isAddingToProduct && (
              <>
                <input
                  type="checkbox"
                  id="is_public"
                  name="is_public"
                  checked={formData.is_public}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
                />
                <Label htmlFor="is_public" className="flex items-center gap-2 text-sm cursor-pointer">
                  <Globe className="w-4 h-4 text-brand-purple" />
                  Share with community
                </Label>
              </>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {prompt 
                ? 'Update Prompt' 
                : isAddingToProduct 
                  ? 'Save to Product Library' 
                  : 'Save Prompt'
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}