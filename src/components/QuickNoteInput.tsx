import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from './ui/button';
import { Loader2, PlusCircle, FileText, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Note: This component is kept for reference but is no longer used
// Quick note functionality has been moved directly to the Layout component
export function QuickNoteInput() {
  const navigate = useNavigate();
  const { productSlug } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddNote = async () => {
    if (!noteContent.trim() || !productSlug) return;

    try {
      setIsSaving(true);
      setError(null);

      // Get product ID and name first
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name')
        .eq('slug', productSlug)
        .single();

      if (productError) throw productError;
      if (!product) throw new Error('Product not found');

      // Check if note already exists for this product
      const { data: existingNotes, error: notesError } = await supabase
        .from('notes')
        .select('id, content')
        .eq('product_id', product.id)
        .maybeSingle();

      if (notesError) throw notesError;

      if (existingNotes) {
        // Append to existing note
        const updatedContent = existingNotes.content + '\n\n' + noteContent;
        const { error: updateError } = await supabase
          .from('notes')
          .update({ content: updatedContent })
          .eq('id', existingNotes.id);

        if (updateError) throw updateError;
      } else {
        // Create a new note with the product name as title
        const { error: createError } = await supabase
          .from('notes')
          .insert({
            title: `${product.name} Notes`,
            content: noteContent,
            product_id: product.id
          });

        if (createError) throw createError;
      }

      // Clear the input and close the dialog
      setNoteContent('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding note:', error);
      setError('Failed to add note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewNotes = () => {
    navigate(`/product/${productSlug}/notes`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-1">
          <PlusCircle className="w-4 h-4" />
          <span className="ml-1">Quick Note</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add a Quick Note</DialogTitle>
          <DialogDescription>
            Quickly jot down ideas and notes without leaving the page.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="py-4">
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Type your note here..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent min-h-[120px]"
            autoFocus
          />
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleViewNotes}
            className="mr-auto"
          >
            <FileText className="w-4 h-4 mr-1" />
            View Notes
          </Button>
          <Button
            variant="secondary"
            onClick={handleAddNote}
            disabled={isSaving || !noteContent.trim()}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                Add Note
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}