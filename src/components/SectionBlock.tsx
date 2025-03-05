import React from 'react';
import { RichTextEditor } from './RichTextEditor';
import { FeatureBuckets } from './FeatureBuckets';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
}

export function SectionBlock({ section, onContentChange, productDetails, onRenameSection }: SectionBlockProps) {
  const handleContentChange = (content: string, subsectionId?: string) => {
    onContentChange(section.id, subsectionId || null, content);
  };

  const handleRenameClick = () => {
    if (onRenameSection && section.isCustom) {
      onRenameSection(section.id, section.title);
    }
  };

  return (
    <div id={`section-${section.id}`} className="scroll-mt-4">
      {section.id === 'overview' ? (
        <div className="space-y-6 p-8 bg-white rounded-t-lg border-b">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <input
              type="text"
              value={productDetails?.name || ''}
              onChange={(e) => {}}
              name="name"
              className="bg-transparent border-b-2 border-dashed border-gray-300 hover:border-brand-purple focus:border-brand-purple p-0 focus:outline-none focus:ring-0 transition-colors flex-1 min-w-0"
              placeholder="Enter product name"
              readOnly
            />
            <span className="flex-shrink-0">Overview</span>
          </h2>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Product Description
            </label>
            <textarea
              id="description"
              name="description"
              value={productDetails?.description || ''}
              onChange={(e) => {}}
              placeholder="Brief description of your product"
              className="w-full min-h-[120px] max-h-[120px] text-sm bg-transparent border border-gray-300 rounded-lg px-3 py-2 resize-y"
              readOnly
            />
          </div>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRenameClick}
                className="ml-2 p-1 h-auto"
                title="Rename section"
              >
                <Pencil className="w-4 h-4 text-gray-500 hover:text-brand-purple" />
              </Button>
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