import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AutoTextarea } from './ui/auto-textarea';
import { useChat } from './context/ChatContext';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface AiChatDialogProps {
  contextData?: {
    section?: string;
    productContext?: string;
    selectedText?: string;
  };
}

export function AiChatDialog({ contextData }: AiChatDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, error, sendMessage, clearError } = useChat();
  const { productSlug } = useParams();
  const [productId, setProductId] = useState<string | null>(null);
  const [selection, setSelection] = useState<string | null>(null);

  // Load product ID when needed
  useEffect(() => {
    async function getProductId() {
      if (!productSlug) return;

      try {
        const { data: product, error } = await supabase
          .from('products')
          .select('id')
          .eq('slug', productSlug)
          .single();

        if (error) throw error;
        setProductId(product.id);
      } catch (error) {
        console.error('Error getting product ID:', error);
      }
    }

    getProductId();
  }, [productSlug]);

  // Save selection when dialog opens
  useEffect(() => {
    if (isOpen && contextData?.selectedText) {
      setSelection(contextData.selectedText);
    }
  }, [isOpen, contextData?.selectedText]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chatRef.current && 
          !chatRef.current.contains(event.target as Node) &&
          !triggerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    
    if (productId) {
      await sendMessage(message, { 
        productId,
        ...contextData,
        selectedText: selection // Use saved selection
      });
    }
  };

  // Update position when dialog opens
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const chatWidth = 500; // Width of chat dialog
      const windowWidth = window.innerWidth;
      
      // Calculate right position to ensure dialog stays within viewport
      const rightPosition = Math.min(
        windowWidth - rect.right,
        windowWidth - chatWidth - 20
      );

      setPosition({
        top: rect.bottom + 10,
        right: Math.max(20, rightPosition)
      });
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={triggerRef}>
      <DropdownMenuItem
        onClick={(e) => {
          e.preventDefault(); // Prevent default dropdown behavior
          e.stopPropagation(); // Stop event from bubbling
          setIsOpen(true);
        }}
        className="flex items-center gap-2"
      >
        <MessageSquare className="w-4 h-4" />
        <span className="text-sm">Chat with AI</span>
      </DropdownMenuItem>

      {isOpen && (
        <div
          ref={chatRef}
          className={cn(
            "fixed z-50 w-[500px] bg-white rounded-lg shadow-xl border border-gray-200",
            "transition-all duration-200 ease-in-out"
          )}
          style={{
            top: `${position.top}px`,
            right: `${position.right}px`,
          }}
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-purple" />
                <h3 className="font-medium">AI Assistant</h3>
                {selection && (
                  <span className="text-xs text-gray-500">
                    (Selected text: {selection.substring(0, 30)}...)
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Ask me anything about your product, features, or requirements.
            </p>
          </div>

          {error && (
            <div className="mx-4 mt-4 bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <p className="flex-1">{error}</p>
              <button 
                onClick={clearError}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="h-[400px] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 italic pt-4">
                Ask me anything! For example:
                <ul className="text-left mt-2 space-y-2">
                  <li>"What features should I prioritize?"</li>
                  <li>"How can I improve my target audience description?"</li>
                  <li>"Suggest some success metrics for my product"</li>
                </ul>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'assistant' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'assistant'
                        ? 'bg-gray-100'
                        : 'bg-brand-purple text-white'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-brand-purple" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <AutoTextarea
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 min-h-[40px] max-h-[120px]"
              />
              <Button
                type="submit"
                variant="secondary"
                disabled={isLoading || !input.trim()}
                className="self-end"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}