import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Copy, BookmarkPlus, Globe, Share2, Bookmark, Save, CopyPlus } from 'lucide-react';

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

interface PromptCardProps {
  prompt: PromptTemplate;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  showProductSave?: boolean;
  onSaveToProduct?: () => void;
  onSaveToPersonal?: () => void;
  onTogglePublic?: () => void;
  isPersonal: boolean;
  isProductPrompt?: boolean;
}

export function PromptCard({
  prompt,
  onEdit,
  onDelete,
  onDuplicate,
  showProductSave = false,
  onSaveToProduct,
  onSaveToPersonal,
  onTogglePublic,
  isPersonal,
  isProductPrompt = false
}: PromptCardProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.template);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleEdit = () => {
    console.log('Edit button clicked in PromptCard, onEdit function exists:', !!onEdit);
    setIsEditing(true);
    if (onEdit) {
      onEdit();
    }
    // Reset the editing state after a delay
    setTimeout(() => setIsEditing(false), 500);
  };

  // Format the date to a readable format
  const formattedDate = new Date(prompt.created_at).toLocaleDateString();

  // Map category to display name
  const getCategoryDisplay = (category: string) => {
    const categoryMap: Record<string, string> = {
      'first': 'First Prompts',
      'system': 'System Prompts',
      'page': 'Page Prompts',
      'feature': 'Feature Prompts',
      'debugging': 'Debugging Prompts',
      'database': 'Database Prompts',
      'authentication': 'Authentication Prompts'
    };
    return categoryMap[category] || category;
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 border ${isProductPrompt ? 'border-brand-purple/30' : 'border-gray-200'}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{prompt.name}</h3>
        <div className="flex items-center gap-1">
          {(isPersonal || isProductPrompt) && onEdit && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleEdit} 
              className={`h-8 w-8 p-0 ${isEditing ? 'text-brand-purple animate-pulse' : ''} ${isProductPrompt ? 'text-brand-purple' : ''}`}
              title={isProductPrompt ? "Edit product prompt" : "Edit prompt"}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCopy} 
            className="h-8 w-8 p-0" 
            title="Copy to clipboard"
          >
            <Copy className="h-4 w-4" />
          </Button>
          {onDuplicate && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDuplicate} 
              className="h-8 w-8 p-0 text-purple-500 hover:text-purple-700"
              title="Duplicate to personal library"
            >
              <CopyPlus className="h-4 w-4" />
            </Button>
          )}
          {isPersonal && onTogglePublic && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onTogglePublic} 
              className={`h-8 w-8 p-0 ${prompt.is_public ? 'text-green-600' : 'text-gray-400'} hover:text-green-700`}
              title={prompt.is_public ? "Make private" : "Share with community"}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
          {(isPersonal || isProductPrompt) && onDelete && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDelete} 
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              title="Delete prompt"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-2">{prompt.description}</p>
      
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs px-2 py-1 bg-brand-purple/10 text-brand-purple rounded-full">
          {getCategoryDisplay(prompt.category)}
        </span>
        {prompt.is_public && (
          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Public
          </span>
        )}
        {isProductPrompt && (
          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
            <Bookmark className="h-3 w-3" />
            Product
          </span>
        )}
        {isPersonal && prompt.is_public && (
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
            <span className="h-3 w-3">👤</span>
            Your Prompt
          </span>
        )}
        <span className="text-xs text-gray-500">
          Created: {formattedDate}
        </span>
      </div>
      
      <div className="bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto mb-3">
        <pre className="text-xs text-gray-700 whitespace-pre-wrap">{prompt.template}</pre>
      </div>
      
      <div className="flex justify-between items-center">
        {isCopied && (
          <span className="text-xs text-green-600">Copied to clipboard!</span>
        )}
        
        <div className="ml-auto flex items-center gap-2">
          {!isPersonal && onSaveToPersonal && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSaveToPersonal}
              className="flex items-center gap-2"
              title="Save a copy to your personal library"
            >
              <Save className="w-4 h-4" />
              Save to Personal
            </Button>
          )}
          
          {showProductSave && onSaveToProduct && (
            <Button 
              variant={isPersonal ? "default" : "outline"}
              size="sm" 
              onClick={onSaveToProduct}
              className="flex items-center gap-2"
              title="Add to product library"
            >
              <BookmarkPlus className="w-4 h-4" />
              Add to Product
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}