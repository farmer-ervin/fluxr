import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowUpRight, ArrowDownRight, Wand2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { processAiText } from '@/lib/aiText';
import { Editor } from '@tiptap/react';

interface AiTextActionsProps {
  editor: Editor | null;
}

export function AiTextActions({ editor }: AiTextActionsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const TOOLBAR_HEIGHT = 36; // Match the height of the floating toolbar

  useEffect(() => {
    if (!editor) return;

    const updateToolbarPosition = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || !selection.toString()) {
        setIsVisible(false);
        return;
      }

      // Only show if text is selected within the editor
      if (!editor.view.dom.contains(selection.anchorNode)) {
        setIsVisible(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setIsVisible(true);
      setPosition({
        top: rect.top - 50, // Position above the selection
        left: rect.left - 15 // Position 15px to the left of the floating toolbar
      });
      
      // Store selected text
      setSelectedText(selection.toString());
    };

    document.addEventListener('selectionchange', updateToolbarPosition);
    return () => document.removeEventListener('selectionchange', updateToolbarPosition);
  }, [editor]);

  const handleAiAction = async (action: 'improve' | 'expand' | 'shorten') => {
    if (!editor || !selectedText.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get the current section from the editor
      const section = editor.view.dom.closest('[id^="section-"]')?.id.replace('section-', '');

      const response = await processAiText({
        text: selectedText,
        action,
        context: {
          section,
          productContext: document.querySelector('input[name="name"]')?.value
        }
      });

      // Replace the selected text with the AI-generated content
      editor
        .chain()
        .focus()
        .setTextSelection(editor.state.selection)
        .insertContent(response.content)
        .run();

    } catch (error) {
      console.error('Error processing text:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!editor || !isVisible) return null;

  return (
    <div
      className={cn(
        "fixed z-50",
        "transition-opacity duration-200",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateY(-100%) translateX(-100%)',
        height: `${TOOLBAR_HEIGHT}px`
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-2 bg-primary/5 text-primary hover:bg-primary/10 h-[36px] px-3 shadow-none"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                AI Actions
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            onClick={() => handleAiAction('improve')}
            className="flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-primary/5 hover:text-primary focus:bg-primary/5 focus:text-primary"
            disabled={isLoading}
          >
            <Wand2 className="w-4 h-4" />
            <span className="text-sm">Improve writing</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleAiAction('expand')}
            className="flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-primary/5 hover:text-primary focus:bg-primary/5 focus:text-primary"
            disabled={isLoading}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-sm">Make longer</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleAiAction('shorten')}
            className="flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-primary/5 hover:text-primary focus:bg-primary/5 focus:text-primary"
            disabled={isLoading}
          >
            <ArrowDownRight className="w-4 h-4" />
            <span className="text-sm">Make shorter</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}