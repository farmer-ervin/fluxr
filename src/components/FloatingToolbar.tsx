import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { 
  Bold, 
  Italic, 
  Link as LinkIcon, 
  Heading1, 
  Heading2, 
  Code, 
  Quote,
  List,
  ListOrdered
} from 'lucide-react';
import { Editor } from '@tiptap/react';

interface FloatingToolbarProps {
  editor: Editor | null;
}

export function FloatingToolbar({ editor }: FloatingToolbarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const TOOLBAR_HEIGHT = 36; // Consistent height for toolbar

  useEffect(() => {
    if (!editor) return;

    const updateToolbarPosition = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || !selection.toString()) {
        setIsVisible(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Only show toolbar if text is selected within the editor
      if (!editor.view.dom.contains(selection.anchorNode)) {
        setIsVisible(false);
        return;
      }

      setIsVisible(true);
      setPosition({
        top: rect.top - 50, // Position above the selection
        left: rect.left // Base position
      });
    };

    document.addEventListener('selectionchange', updateToolbarPosition);
    return () => document.removeEventListener('selectionchange', updateToolbarPosition);
  }, [editor]);

  if (!editor || !isVisible) return null;

  return (
    <div
      className={cn(
        "fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 px-2 flex items-center gap-1",
        "transition-opacity duration-200",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left + 15}px`, // Position 15px to the right of the AI button
        transform: 'translateY(-100%)',
        height: `${TOOLBAR_HEIGHT}px`
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-gray-200' : ''}
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-gray-200' : ''}
      >
        <Italic className="w-4 h-4" />
      </Button>
      <div className="w-px h-4 bg-gray-200" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}
      >
        <Heading1 className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
      >
        <Heading2 className="w-4 h-4" />
      </Button>
      <div className="w-px h-4 bg-gray-200" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
      >
        <ListOrdered className="w-4 h-4" />
      </Button>
      <div className="w-px h-4 bg-gray-200" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive('codeBlock') ? 'bg-gray-200' : ''}
      >
        <Code className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'bg-gray-200' : ''}
      >
        <Quote className="w-4 h-4" />
      </Button>
      <div className="w-px h-4 bg-gray-200" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const url = window.prompt('Enter URL:');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={editor.isActive('link') ? 'bg-gray-200' : ''}
      >
        <LinkIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}