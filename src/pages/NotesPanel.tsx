import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { RichTextEditor } from '@/components/RichTextEditor';
import { PageTitle } from '@/components/PageTitle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  AlertCircle, 
  StickyNote, 
  CheckSquare, 
  ListTodo, 
  Lightbulb,
  PlusCircle
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('notes');

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
          
          if (notes && notes.length > 0) {
            setNoteId(notes[0].id);
            setContent(notes[0].content);
          } else {
            setNoteId(null);
            setContent('');
          }
        } else {
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
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{productName} Notes</h1>
            <p className="text-muted-foreground mt-1">
              Capture your thoughts, tasks, and ideas for {productName}
            </p>
          </div>
          {isSaving && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </div>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <StickyNote className="w-4 h-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="todos" className="flex items-center gap-2">
              <ListTodo className="w-4 h-4" />
              To-Dos
            </TabsTrigger>
            <TabsTrigger value="ideas" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Ideas
            </TabsTrigger>
            <TabsTrigger value="done" className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Done
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Quick Notes</CardTitle>
                <CardDescription>
                  Capture your thoughts and important information about {productName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="min-h-[500px] rounded-lg border">
                  <RichTextEditor
                    content={content}
                    onChange={handleContentChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="todos" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>To-Do List</CardTitle>
                    <CardDescription>
                      Track tasks and action items
                    </CardDescription>
                  </div>
                  <Button size="sm" className="gap-2">
                    <PlusCircle className="w-4 h-4" />
                    Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Coming soon: Dedicated to-do list functionality
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ideas" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Ideas & Brainstorming</CardTitle>
                    <CardDescription>
                      Capture product ideas and inspiration
                    </CardDescription>
                  </div>
                  <Button size="sm" className="gap-2">
                    <PlusCircle className="w-4 h-4" />
                    Add Idea
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Coming soon: Dedicated ideas and brainstorming section
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="done" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Completed Items</CardTitle>
                <CardDescription>
                  Track your progress and achievements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Coming soon: Archive of completed tasks and milestones
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}