import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';

interface Item {
  id: string;
  name: string;
  description?: string;
  priority?: string;
  implementation_status: string;
  position?: number;
  type?: 'feature' | 'page' | 'bug' | 'task';
}

interface FilterState {
  types: Set<string>;
  priorities: Set<string>;
}

export function useKanban() {
  const { productSlug } = useParams();
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    types: new Set<string>(),
    priorities: new Set<string>()
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<number>(0);

  useEffect(() => {
    loadItems();
  }, [productSlug, user]);

  useEffect(() => {
    setActiveFilters(filters.types.size + filters.priorities.size);
  }, [filters]);

  const loadItems = async () => {
    if (!productSlug || !user) return;

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
        throw new Error('Product not found');
      }

      // Load features
      const { data: features, error: featuresError } = await supabase
        .from('features')
        .select('*')
        .eq('product_id', product.id)
        .order('position', { ascending: true });

      if (featuresError) throw featuresError;

      // Load pages
      const { data: pages, error: pagesError } = await supabase
        .from('flow_pages')
        .select('*')
        .eq('product_id', product.id);

      if (pagesError) throw pagesError;

      // Load bugs
      const { data: bugs, error: bugsError } = await supabase
        .from('bugs')
        .select('*')
        .eq('product_id', product.id);

      if (bugsError) throw bugsError;

      // Load tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('product_id', product.id);

      if (tasksError) throw tasksError;

      const allItems = [
        ...(features || []).map(f => ({ ...f, type: 'feature' })),
        ...(pages || []).map(p => ({ ...p, type: 'page' })),
        ...(bugs || []).map(b => ({ ...b, type: 'bug' })),
        ...(tasks || []).map(t => ({ ...t, type: 'task' }))
      ];

      setItems(allItems);
    } catch (error) {
      console.error('Error loading items:', error);
      setError(error instanceof Error ? error : new Error('Failed to load items'));
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (newItem: Partial<Item>) => {
    if (!productSlug || !user) return;

    try {
      const { data: product } = await supabase
        .from('products')
        .select('id')
        .eq('slug', productSlug)
        .eq('user_id', user.id)
        .single();

      if (!product) throw new Error('Product not found');

      // Base item data common to all types
      const itemData = {
        name: newItem.name,
        description: newItem.description,
        product_id: product.id,
        implementation_status: 'not_started',
        priority: newItem.priority || 'not-prioritized'
      };

      // Add type-specific fields
      const itemDataWithTypeSpecificFields = (() => {
        switch (newItem.type) {
          case 'feature':
            return {
              ...itemData,
              position: items.filter(i => i.type === 'feature').length
            };
          case 'page':
            return {
              ...itemData,
              position: 0 // Pages use position_x/y for flow diagram
            };
          case 'bug':
            return {
              ...itemData,
              position: items.filter(i => i.type === 'bug').length
            };
          case 'task':
            return {
              ...itemData,
              position: items.filter(i => i.type === 'task').length
            };
          default:
            return itemData;
        }
      })();

      let data;
      let error;

      switch (newItem.type) {
        case 'feature':
          ({ data, error } = await supabase
            .from('features')
            .insert([itemDataWithTypeSpecificFields])
            .select()
            .single());
          break;
        case 'page':
          ({ data, error } = await supabase
            .from('flow_pages')
            .insert([itemDataWithTypeSpecificFields])
            .select()
            .single());
          break;
        case 'bug':
          ({ data, error } = await supabase
            .from('bugs')
            .insert([itemDataWithTypeSpecificFields])
            .select()
            .single());
          break;
        case 'task':
          ({ data, error } = await supabase
            .from('tasks')
            .insert([itemDataWithTypeSpecificFields])
            .select()
            .single());
          break;
        default:
          throw new Error('Invalid item type');
      }

      if (error) throw error;
      if (data) {
        setItems(prev => [...prev, { ...data, type: newItem.type }]);
      }
    } catch (error) {
      console.error('Error adding item:', error);
      throw error;
    }
  };

  const updateItem = async (itemId: string, updates: Partial<Item>) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) throw new Error('Item not found');

      let data;
      let error;

      switch (item.type) {
        case 'feature':
          ({ data, error } = await supabase
            .from('features')
            .update(updates)
            .eq('id', itemId)
            .select()
            .single());
          break;
        case 'page':
          ({ data, error } = await supabase
            .from('flow_pages')
            .update(updates)
            .eq('id', itemId)
            .select()
            .single());
          break;
        case 'bug':
          ({ data, error } = await supabase
            .from('bugs')
            .update(updates)
            .eq('id', itemId)
            .select()
            .single());
          break;
        case 'task':
          ({ data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', itemId)
            .select()
            .single());
          break;
        default:
          throw new Error('Invalid item type');
      }

      if (error) throw error;
      if (data) {
        setItems(prev => prev.map(i => 
          i.id === itemId ? { ...data, type: item.type } : i
        ));
      }
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) throw new Error('Item not found');

      let error;

      switch (item.type) {
        case 'feature':
          ({ error } = await supabase
            .from('features')
            .delete()
            .eq('id', itemId));
          break;
        case 'page':
          ({ error } = await supabase
            .from('flow_pages')
            .delete()
            .eq('id', itemId));
          break;
        case 'bug':
          ({ error } = await supabase
            .from('bugs')
            .delete()
            .eq('id', itemId));
          break;
        case 'task':
          ({ error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', itemId));
          break;
        default:
          throw new Error('Invalid item type');
      }

      if (error) throw error;
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  };

  const onTypeFilterChange = (type: string) => {
    setFilters(prev => {
      const newTypes = new Set(prev.types);
      if (newTypes.has(type)) {
        newTypes.delete(type);
      } else {
        newTypes.add(type);
      }
      return { ...prev, types: newTypes };
    });
  };

  const onPriorityFilterChange = (priority: string) => {
    setFilters(prev => {
      const newPriorities = new Set(prev.priorities);
      if (newPriorities.has(priority)) {
        newPriorities.delete(priority);
      } else {
        newPriorities.add(priority);
      }
      return { ...prev, priorities: newPriorities };
    });
  };

  const onClearFilters = () => {
    setFilters({
      types: new Set<string>(),
      priorities: new Set<string>()
    });
  };

  const onSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  return {
    items: items.filter(item => {
      // First apply type and priority filters
      const passesTypeFilter = filters.types.size === 0 || 
                           (item.type && filters.types.has(item.type));
      
      const passesPriorityFilter = filters.priorities.size === 0 || 
                               (item.priority && filters.priorities.has(item.priority));
      
      const passesBasicFilters = passesTypeFilter && passesPriorityFilter;
      
      // Then apply search filter if it exists
      if (!passesBasicFilters) return false;
      
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        (item.name && item.name.toLowerCase().includes(query)) || 
        (item.description && item.description.toLowerCase().includes(query))
      );
    }),
    loading,
    error,
    filters,
    activeFilters,
    searchQuery,
    onTypeFilterChange,
    onPriorityFilterChange,
    onClearFilters,
    onSearchChange,
    addItem,
    updateItem,
    deleteItem,
  };
} 