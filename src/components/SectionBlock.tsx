import React, { useState, useRef } from 'react';
import { RichTextEditor } from './RichTextEditor';
import { FeatureBuckets } from './FeatureBuckets';
import { Pencil, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductNameDialog } from './ProductNameDialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  placeholder: string;
  subsections?: {
    id: string;
    title: string;
    content: string;
    placeholder: string;
  }[];
  isCustom?: boolean;
}

interface SectionBlockProps {
  section: Section;
  onContentChange: (sectionId: string, subsectionId: string | null, content: string) => void;
  productDetails: any;
  onRenameSection?: (sectionId: string, title: string) => void;
  onProductNameChange?: (name: string) => void;
  onDeleteSection?: (sectionId: string) => void;
}

export function SectionBlock({ section, onContentChange, productDetails, onRenameSection, onProductNameChange, onDeleteSection }: SectionBlockProps) {
  const [isEditingName, setIsEditingName] = useState(false);

  const handleContentChange = (content: string, subsectionId?: string) => {
    onContentChange(section.id, subsectionId || null, content);
  };

  const handleRenameClick = () => {
    if (onRenameSection && section.isCustom) {
      onRenameSection(section.id, section.title);
    }
  };

  const handleProductNameSave = (name: string) => {
    if (onProductNameChange) {
      onProductNameChange(name);
    }
  };

  return (
    <div id={`section-${section.id}`} className="scroll-mt-4">
      {section.id === 'overview' ? (
        <div className="bg-white rounded-t-lg border-b">
          <div className="p-8 pb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {section.icon}
              <span>{productDetails?.name || ''} Product Requirements</span>
              <button
                onClick={() => setIsEditingName(true)}
                className="ml-2 p-1 h-auto text-gray-500 hover:text-brand-purple"
                title="Edit product name"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </h2>
          </div>
          <div className="px-8 pb-8">
            <div className="flex items-center gap-2 mb-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Product Description
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">After generating a PRD, Product Description is not used in other prompt inputs. Instead, the core content of the PRD is used including problem, solution, and target audience.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <RichTextEditor
              content={productDetails?.description || ''}
              onChange={(content) => onContentChange('description', null, content)}
            />
          </div>
          <ProductNameDialog
            isOpen={isEditingName}
            onClose={() => setIsEditingName(false)}
            onSave={handleProductNameSave}
            currentName={productDetails?.name || ''}
          />
        </div>
      ) : section.id === 'features' ? (
        <div className="space-y-4 p-8 bg-white border-b">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {section.icon}
            <span>{section.title}</span>
          </h2>
          <FeatureBuckets
            content={section.content || section.placeholder}
            onChange={(content) => handleContentChange(content)}
          />
        </div>
      ) : (
        <div className="space-y-4 p-8 bg-white border-b">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {section.icon}
            <span>{section.title}</span>
            {section.isCustom && onRenameSection && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRenameClick}
                  className="ml-2 p-1 h-auto"
                  title="Rename section"
                >
                  <Pencil className="w-4 h-4 text-gray-500 hover:text-brand-purple" />
                </Button>
              </div>
            )}
          </h2>
          <RichTextEditor
            content={section.content || section.placeholder}
            onChange={(content) => handleContentChange(content)}
          />
        </div>
      )}
    </div>
  );
}