import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext } from '@hello-pangea/dnd';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/PageTitle';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { KanbanHeader } from '@/components/kanban/KanbanHeader';
import { AddFeatureDialog } from '@/components/kanban/AddFeatureDialog';
import { AddPageDialog } from '@/components/flow/AddPageDialog';
import { AddBugDialog } from '@/components/kanban/AddBugDialog';
import { AddTaskDialog } from '@/components/kanban/AddTaskDialog';
import { COLUMNS, updateNodePositions, handleEdgeChanges, loadInitialData } from '@/lib/kanban';
import { getAllBugs, createBug, updateBug, deleteBug } from '@/services/bugService';
import { createTask, getAllTasks, updateTask, deleteTask } from '@/services/taskService';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';

interface Feature {
  id: string;
  name: string;
  description: string;
  priority: 'must-have' | 'nice-to-have' | 'not-prioritized';
  implementation_status: 'not_started' | 'in_progress' | 'completed';
  position: number;
  type?: 'feature' | 'page' | 'task' | 'bug';
}

interface FilterState {
  types: Set<string>;
  priorities: Set<string>;
}

export function KanbanBoard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { productSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [bugs, setBugs] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    types: new Set<string>(),
    priorities: new Set<string>()
  });
  const [activeFilters, setActiveFilters] = useState<number>(0);
  const [isAddFeatureDialogOpen, setIsAddFeatureDialogOpen] = useState(false);
  const [isAddPageDialogOpen, setIsAddPageDialogOpen] = useState(false);
  const [isAddBugDialogOpen, setIsAddBugDialogOpen] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isAddingFeature, setIsAddingFeature] = useState(false);
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [addPageError, setAddPageError] = useState<string | null>(null);
  const [isLoadingBugs, setIsLoadingBugs] = useState(false);
  const [bugError, setBugError] = useState<string | null>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [isTaskLoading, setIsTaskLoading] = useState(false);
  const [deleteDialogState, setDeleteDialogState] = useState<{
    isOpen: boolean;
    itemType: string;
    itemId: string | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    itemType: '',
    itemId: null,
    isDeleting: false
  });

  useEffect(() => {
    async function loadData() {
      if (!productSlug) {
        navigate('/');
        return;
      }

      if (!user) {
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id')
          .eq('slug', productSlug)
          .eq('user_id', user.id)
          .single();

        if (productError || !product) {
          console.error('Error loading product:', productError);
          navigate('/');
          return;
        }

        setProductId(product.id);

        const { features: loadedFeatures, pages: loadedPages } = await loadInitialData(product.id, user.id);
        setFeatures(loadedFeatures);
        setPages(loadedPages);

        // Load bugs and tasks with product ID
        const bugsData = await getAllBugs(product.id);
        const tasksData = await getAllTasks(product.id);
        setBugs(bugsData);
        setTasks(tasksData);

      } catch (error) {
        console.error('Error loading data:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [productSlug, user, navigate]);

  useEffect(() => {
    setActiveFilters(filters.types.size + filters.priorities.size);
  }, [filters]);

  const displayItems = useMemo(() => {
    const items = [
      ...features.map(f => ({ ...f, type: 'feature' })),
      ...pages.map(p => ({ ...p, type: 'page' })),
      ...bugs.map(b => ({ ...b, type: 'bug' })),
      ...tasks.map(t => ({ ...t, type: 'task' }))
    ];

    return items.filter(item => {
      if (filters.types.size === 0 && filters.priorities.size === 0) {
        return true;
      }

      const passesTypeFilter = filters.types.size === 0 || 
                            (item.type && filters.types.has(item.type)) ||
                            ((!item.type || item.type === 'feature') && filters.types.has('feature'));
      
      const passesPriorityFilter = filters.priorities.size === 0 || 
                                (item.priority && filters.priorities.has(item.priority));
      
      return passesTypeFilter && passesPriorityFilter;
    });
  }, [features, pages, bugs, tasks, filters]);

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    try {
      const item = displayItems.find(i => i.id === draggableId);
      if (!item) return;

      if (item.type === 'bug') {
        await updateBug(draggableId, { status: destination.droppableId });
        setBugs(prev => prev.map(bug => 
          bug.id === draggableId 
            ? { ...bug, status: destination.droppableId }
            : bug
        ));
      } else if (item.type === 'task') {
        await updateTask(draggableId, { status: destination.droppableId });
        setTasks(prev => prev.map(task => 
          task.id === draggableId 
            ? { ...task, status: destination.droppableId }
            : task
        ));
      } else if (item.type === 'page') {
        await supabase
          .from('flow_pages')
          .update({ implementation_status: destination.droppableId })
          .eq('id', draggableId);
        
        const { data } = await supabase
          .from('flow_pages')
          .select('*')
          .eq('product_id', productId);
        
        setPages(data || []);
      } else {
        await supabase
          .from('features')
          .update({
            implementation_status: destination.droppableId,
            position: destination.index
          })
          .eq('id', draggableId);
        
        const { data } = await supabase
          .from('features')
          .select('*')
          .eq('product_id', productId)
          .order('position', { ascending: true });
        
        setFeatures(data || []);
      }
    } catch (error) {
      console.error('Error updating item:', error);
      setError('Failed to update item position. Please try again.');
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    setDeleteDialogState({
      isOpen: true,
      itemType: 'Feature',
      itemId: featureId,
      isDeleting: false
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialogState.itemId) return;
    
    try {
      setDeleteDialogState(prev => ({ ...prev, isDeleting: true }));

      switch (deleteDialogState.itemType) {
        case 'Feature':
          // First get the feature to check if it has a screenshot
          const { data: feature, error: fetchError } = await supabase
            .from('features')
            .select('screenshot_url')
            .eq('id', deleteDialogState.itemId)
            .single();
          
          if (fetchError) throw fetchError;

          // If there's a screenshot, delete it from storage
          if (feature?.screenshot_url) {
            const path = feature.screenshot_url.split('/').pop(); // Get filename from URL
            if (path) {
              const { error: storageError } = await supabase.storage
                .from('feature-screenshots')
                .remove([path]);
              
              if (storageError) {
                console.error('Error deleting screenshot:', storageError);
              }
            }
          }

          // Now delete the feature
          const { error } = await supabase
            .from('features')
            .delete()
            .match({ id: deleteDialogState.itemId });
          
          if (error) throw error;
          setFeatures(prev => prev.filter(f => f.id !== deleteDialogState.itemId));
          break;

        case 'Page':
          const { error: pageError } = await supabase
            .from('flow_pages')
            .delete()
            .match({ id: deleteDialogState.itemId });
          
          if (pageError) throw pageError;
          setPages(prev => prev.filter(p => p.id !== deleteDialogState.itemId));
          break;

        case 'Bug':
          await deleteBug(deleteDialogState.itemId);
          setBugs(prev => prev.filter(b => b.id !== deleteDialogState.itemId));
          break;

        case 'Task':
          await deleteTask(deleteDialogState.itemId);
          setTasks(prev => prev.filter(t => t.id !== deleteDialogState.itemId));
          break;
      }

      setDeleteDialogState({
        isOpen: false,
        itemType: '',
        itemId: null,
        isDeleting: false
      });
    } catch (error) {
      console.error(`Error deleting ${deleteDialogState.itemType.toLowerCase()}:`, error);
      setError(`Failed to delete ${deleteDialogState.itemType.toLowerCase()}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-purple mx-auto mb-4" />
          <p className="text-gray-600">Loading development board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
        <p className="text-red-600 mb-6">{error}</p>
        <Button
          onClick={() => navigate('/')}
          variant="secondary"
          className="mx-auto"
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 md:space-y-6 pb-6 md:pb-12">
      <PageTitle title="Development" />
      
      <KanbanHeader
        onAddFeature={() => setIsAddFeatureDialogOpen(true)}
        onAddPage={() => setIsAddPageDialogOpen(true)}
        onAddBug={() => setIsAddBugDialogOpen(true)}
        onAddTask={() => setIsAddTaskDialogOpen(true)}
        filters={filters}
        onTypeFilterChange={(type) => {
          setFilters(prev => {
            const newTypes = new Set(prev.types);
            if (newTypes.has(type)) {
              newTypes.delete(type);
            } else {
              newTypes.add(type);
            }
            return { ...prev, types: newTypes };
          });
        }}
        onPriorityFilterChange={(priority) => {
          setFilters(prev => {
            const newPriorities = new Set(prev.priorities);
            if (newPriorities.has(priority)) {
              newPriorities.delete(priority);
            } else {
              newPriorities.add(priority);
            }
            return { ...prev, priorities: newPriorities };
          });
        }}
        onClearFilters={() => {
          setFilters({
            types: new Set<string>(),
            priorities: new Set<string>()
          });
        }}
        activeFilters={activeFilters}
      />

      {activeFilters > 0 && (
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-sm text-gray-600">
            <strong>Active filters:</strong> {' '}
            {filters.types.size > 0 && (
              <span className="mr-2">
                Types: {Array.from(filters.types).join(', ')}
              </span>
            )}
            {filters.priorities.size > 0 && (
              <span>
                Priorities: {Array.from(filters.priorities).join(', ')}
              </span>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-500 hover:text-gray-700 w-full sm:w-auto"
            onClick={() => setFilters({
              types: new Set<string>(),
              priorities: new Set<string>()
            })}
          >
            Clear All
          </Button>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 overflow-x-auto min-h-[calc(100vh-200px)]">
          {COLUMNS.map((column) => (
            <div 
              key={column.id} 
              className={`${column.color} rounded-lg shadow-md p-4 mb-4 lg:mb-0 min-h-[200px] lg:min-h-[500px] flex-1 flex flex-col w-full lg:w-80 lg:flex-shrink-0`}
            >
              <KanbanColumn
                title={column.title}
                droppableId={column.id}
                items={displayItems.filter(item => 
                  item.implementation_status === column.id || 
                  item.status === column.id
                )}
                onFeatureStatusChange={async (featureId, newStatus) => {
                  const { error } = await supabase
                    .from('features')
                    .update({ implementation_status: newStatus })
                    .eq('id', featureId);
                  
                  if (error) {
                    setError('Failed to update feature status');
                  }
                }}
                onPageStatusChange={async (pageId, newStatus) => {
                  const { error } = await supabase
                    .from('flow_pages')
                    .update({ implementation_status: newStatus })
                    .eq('id', pageId);
                  
                  if (error) {
                    setError('Failed to update page status');
                  }
                }}
                onBugStatusChange={async (bugId, newStatus) => {
                  await updateBug(bugId, { status: newStatus });
                  await getAllBugs().then(setBugs);
                }}
                onTaskStatusChange={async (taskId, newStatus) => {
                  await updateTask(taskId, { status: newStatus });
                  await getAllTasks().then(setTasks);
                }}
                onDeleteFeature={handleDeleteFeature}
                onDeletePage={(pageId) => {
                  setDeleteDialogState({
                    isOpen: true,
                    itemType: 'Page',
                    itemId: pageId,
                    isDeleting: false
                  });
                }}
                onDeleteBug={(bugId) => {
                  setDeleteDialogState({
                    isOpen: true,
                    itemType: 'Bug',
                    itemId: bugId,
                    isDeleting: false
                  });
                }}
                onDeleteTask={(taskId) => {
                  setDeleteDialogState({
                    isOpen: true,
                    itemType: 'Task',
                    itemId: taskId,
                    isDeleting: false
                  });
                }}
              />
            </div>
          ))}
        </div>
      </DragDropContext>

      <AddFeatureDialog
        isOpen={isAddFeatureDialogOpen}
        onClose={() => setIsAddFeatureDialogOpen(false)}
        onAdd={async (newFeature) => {
          if (!productId) return;
          try {
            setIsAddingFeature(true);
            const { data, error } = await supabase
              .from('features')
              .insert({
                product_id: productId,
                ...newFeature,
                position: features.length
              })
              .select()
              .single();

            if (error) throw error;
            setFeatures(prev => [...prev, data]);
            setIsAddFeatureDialogOpen(false);
          } catch (error) {
            console.error('Error adding feature:', error);
            setError('Failed to add feature');
          } finally {
            setIsAddingFeature(false);
          }
        }}
        isLoading={isAddingFeature}
      />

      <AddPageDialog
        isOpen={isAddPageDialogOpen}
        onClose={() => setIsAddPageDialogOpen(false)}
        onAddPage={async (pageData) => {
          if (!productId) return;
          try {
            setIsAddingPage(true);
            setAddPageError(null);
            
            const { data, error } = await supabase
              .from('flow_pages')
              .insert({
                product_id: productId,
                name: pageData.name,
                description: pageData.description,
                layout_description: pageData.layout_description,
                features: pageData.features,
                implementation_status: 'not_started'
              })
              .select()
              .single();

            if (error) throw error;
            setPages(prev => [...prev, data]);
            setIsAddPageDialogOpen(false);
          } catch (error) {
            console.error('Error adding page:', error);
            setAddPageError('Failed to add page');
          } finally {
            setIsAddingPage(false);
          }
        }}
        isLoading={isAddingPage}
        error={addPageError}
      />

      <AddBugDialog
        isOpen={isAddBugDialogOpen}
        onClose={() => setIsAddBugDialogOpen(false)}
        onSave={async (bugData) => {
          try {
            const newBug = await createBug(bugData, []);
            if (newBug) {
              setBugs(prev => [...prev, newBug]);
              setIsAddBugDialogOpen(false);
            }
          } catch (error) {
            setBugError('Failed to create bug');
            console.error('Error creating bug:', error);
          }
        }}
        isLoading={isLoadingBugs}
        error={bugError}
        productId={productId || ''}
      />

      <AddTaskDialog
        isOpen={isAddTaskDialogOpen}
        onClose={() => setIsAddTaskDialogOpen(false)}
        onSave={async (taskData) => {
          try {
            const newTask = await createTask(taskData);
            if (newTask) {
              setTasks(prev => [...prev, newTask]);
              setIsAddTaskDialogOpen(false);
            }
          } catch (error) {
            setTaskError('Failed to create task');
            console.error('Error creating task:', error);
          }
        }}
        isLoading={isLoadingTasks}
        error={taskError}
        productId={productId || ''}
      />

      <ConfirmDeleteDialog
        isOpen={deleteDialogState.isOpen}
        onClose={() => setDeleteDialogState({
          isOpen: false,
          itemType: '',
          itemId: null,
          isDeleting: false
        })}
        onConfirm={handleConfirmDelete}
        itemType={deleteDialogState.itemType}
        isDeleting={deleteDialogState.isDeleting}
      />
    </div>
  );
}