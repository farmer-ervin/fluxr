import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { RichTextEditor } from '@/components/RichTextEditor';
import { PageTitle } from '@/components/PageTitle';
import { Loader2, AlertCircle } from 'lucide-react';
import debounce from 'lodash.debounce';

export function NotesPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { productSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [productId, setProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [noteId, setNoteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const debouncedSave = useCallback(
    debounce(async (noteId: string | null, content: string, productId: string | null) => {
      try {
        setIsSaving(true);

        if (noteId) {
          // Update existing note
          const { error } = await supabase
            .from('notes')
            .update({ content })
            .eq('id', noteId);

          if (error) throw error;
        } else if (productId) {
          // Create new note with fixed title format
          const { data, error } = await supabase
            .from('notes')
            .insert({
              title: `${productName} Notes`,
              content,
              product_id: productId
            })
            .select()
            .single();

          if (error) throw error;
          setNoteId(data.id);
        }
      } catch (error) {
        console.error('Error saving note:', error);
        setError('Failed to save note. Your changes may be lost.');
      } finally {
        setIsSaving(false);
      }
    }, 1000),
    [productName]
  );

  useEffect(() => {
    async function loadNote() {
      if (!user) {
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (productSlug) {
          // Get the product ID and name
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, name')
            .eq('slug', productSlug)
            .single();

          if (productError) throw productError;
          if (!product) throw new Error('Product not found');

          setProductId(product.id);
          setProductName(product.name);
          
          // Get the most recent note for this product
          const { data: notes, error: notesError } = await supabase
            .from('notes')
            .select('*')
            .eq('product_id', product.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (notesError) throw notesError;
          
          // If note exists, use it; otherwise we'll create one on first save
          if (notes && notes.length > 0) {
            setNoteId(notes[0].id);
            setContent(notes[0].content);
          } else {
            setNoteId(null);
            setContent('');
          }
        } else {
          // Handle personal notes case if needed or redirect to dashboard
          navigate('/');
          return;
        }
      } catch (error) {
        console.error('Error loading note:', error);
        setError('Failed to load note. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadNote();
  }, [productSlug, user, navigate]);

  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  const handleContentChange = async (newContent: string) => {
    setContent(newContent);
    setError(null);

    if (!user || !productId) return;
    debouncedSave(noteId, newContent, productId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-purple mx-auto mb-4" />
          <p className="text-gray-600">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageTitle title={productSlug ? 'Product Notes' : 'Personal Notes'} />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{productName} Notes</h1>
        
        {isSaving && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      <div className="flex-1 w-full bg-white rounded-lg shadow-sm border border-border overflow-hidden">
        <RichTextEditor
          content={content}
          onChange={handleContentChange}
        />
      </div>
    </div>
  );
}