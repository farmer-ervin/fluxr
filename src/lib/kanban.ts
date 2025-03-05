import { supabase } from './supabase';
import { NodeChange, EdgeChange } from 'reactflow';

export const COLUMNS = [
  { id: 'not_started', title: 'Not Started', color: 'bg-gray-100 border-gray-200 border' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50 border-blue-200 border' },
  { id: 'completed', title: 'Completed', color: 'bg-green-50 border-green-200 border' }
];

export async function updateNodePositions(changes: NodeChange[], productId: string) {
  if (!productId) return;

  try {
    for (const change of changes) {
      if (change.type === 'position' && change.position) {
        await supabase
          .from('flow_pages')
          .update({
            position_x: change.position.x,
            position_y: change.position.y
          })
          .eq('id', change.id);
      }
    }
  } catch (error) {
    console.error('Error updating node positions:', error);
  }
}

export async function handleEdgeChanges(changes: EdgeChange[], productId: string, edges: any[]) {
  if (!productId) return;

  try {
    const removedEdges = changes.filter(change => change.type === 'remove');
    if (removedEdges.length > 0) {
      for (const change of removedEdges) {
        const { error } = await supabase
          .from('flow_connections')
          .delete()
          .eq('id', change.id);

        if (error) {
          console.error('Error deleting connection:', error);
          throw new Error('Failed to delete connection');
        }
      }
    }
  } catch (error) {
    console.error('Error deleting connections:', error);
    throw error;
  }
}

export async function loadInitialData(productId: string, userId: string) {
  try {
    const [featuresResult, pagesResult] = await Promise.all([
      supabase
        .from('features')
        .select('*')
        .eq('product_id', productId)
        .order('position', { ascending: true }),
      supabase
        .from('flow_pages')
        .select('*')
        .eq('product_id', productId)
    ]);

    if (featuresResult.error) {
      throw featuresResult.error;
    }

    if (pagesResult.error) {
      throw pagesResult.error;
    }

    const processedFeatures = (featuresResult.data || []).map(feature => ({
      ...feature,
      type: feature.type || 'feature'
    }));

    return {
      features: processedFeatures,
      pages: pagesResult.data || []
    };
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
}