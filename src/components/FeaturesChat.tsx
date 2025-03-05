import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { MessageSquare, Loader2, AlertCircle, Check } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { useChat } from './context/ChatContext';
import { supabase } from '@/lib/supabase';

export function FeaturesChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [productId, setProductId] = useState<string | null>(null);
  const { productSlug } = useParams();
  const { 
    messages, 
    isLoading, 
    error, 
    featurePreviews, 
    sendMessage, 
    clearChat, 
    acceptFeature,
    updateFeature,
    deleteFeature
  } = useChat();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !productId) return;

    const userMessage = input.trim();
    setInput('');
    
    await sendMessage(userMessage, { productId });
  };

  const handleClose = () => {
    setIsOpen(false);
    clearChat();
  };

  const renderFeaturePreviews = () => {
    if (featurePreviews.length === 0) return null;

    return (
      <div className="mt-4 border-t pt-4">
        <h3 className="text-lg font-semibold mb-2">Suggested Feature Changes</h3>
        {featurePreviews.map((feature, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium">
                {feature.id ? 'Update Feature' : 'New Feature'}
              </h4>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => feature.id ? updateFeature(feature) : acceptFeature(feature)}
                  className="flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  {feature.id ? 'Update' : 'Add'}
                </Button>
                {feature.id && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteFeature(feature.id!)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Name:</span> {feature.name}
              </div>
              <div>
                <span className="font-medium">Description:</span> {feature.description}
              </div>
              <div>
                <span className="font-medium">Priority:</span> {feature.priority}
              </div>
              <div>
                <span className="font-medium">Status:</span> {feature.implementation_status}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen => {
      if (!setOpen) clearChat();
      setIsOpen(setOpen);
    }}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          AI Feature Assistant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>AI Feature Assistant</DialogTitle>
          <DialogDescription>
            Ask for help with feature ideas, refinement, or prioritization.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="h-[300px] overflow-y-auto border rounded-lg p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 italic pt-4">
                Ask me to help with your features! For example:
                <ul className="text-left mt-2 space-y-2">
                  <li>"Suggest three must-have features for my product"</li>
                  <li>"Help me prioritize my existing features"</li>
                  <li>"What features am I missing for my target audience?"</li>
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
          </div>

          {renderFeaturePreviews()}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 min-h-[80px]"
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={isLoading || !input.trim() || !productId}
              className="self-end"
            >
              Send
            </Button>
          </form>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}