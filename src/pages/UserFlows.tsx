import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  NodeChange,
  EdgeChange,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  getIncomers,
  getOutgoers,
  MarkerType,
  EdgeMouseHandler,
  EdgeProps,
  getBezierPath
} from 'reactflow';
import 'reactflow/dist/style.css';
import { PageTitle } from '@/components/PageTitle';
import { Button } from '@/components/ui/button';
import { Plus, Undo, Redo, Loader2, Sparkles, AlertCircle, Trash2 } from 'lucide-react';
import { FlowGenerationDialog } from '@/components/flow/FlowGenerationDialog';
import { FlowPatternDialog, FlowPattern } from '@/components/flow/FlowPatternDialog';
import { FlowReviewDialog } from '@/components/flow/FlowReviewDialog';
import { OptionalRefinementDialog } from '@/components/flow/OptionalRefinementDialog';
import { PageNode, PageNodeData } from '@/components/flow/PageNode';
import { AddPageDialog, PageData } from '@/components/flow/AddPageDialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  generateUserFlow, 
  generateFlowLayout, 
  reviewUserFlow, 
  OpenAIError, 
  FlowPage,
  refineUserFlow,
  RefinementResponse
} from '@/lib/openai';
import { RefinementChangesDialog } from '@/components/flow/RefinementChangesDialog';

function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data
}: EdgeProps) {
  const [edgePath, centerX, centerY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const onDelete = data?.onDelete;

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? '#5D4A8C' : '#7056A4',
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        onMouseEnter={() => setShowDeleteButton(true)}
        onMouseLeave={() => setShowDeleteButton(false)}
      />
      {(selected || showDeleteButton) && (
        <foreignObject
          width={20}
          height={20}
          x={centerX - 10}
          y={centerY - 10}
          className="edgebutton-foreignobject"
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <div
            className="absolute -top-2 -left-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer hover:bg-red-50 transition-colors border border-gray-200"
            onClick={(event) => {
              event.stopPropagation();
              if (onDelete) {
                onDelete(id);
              }
            }}
          >
            <Trash2 className="w-3 h-3 text-red-500" />
          </div>
        </foreignObject>
      )}
    </>
  );
}

const nodeTypes = {
  page: PageNode
};

const edgeTypes = {
  default: CustomEdge,
};

interface Product {
  id: string;
  name: string;
  description: string;
}

interface PRD {
  problem: string;
  solution: string;
}

interface FlowPageDB {
  id: string;
  name: string;
  description: string;
  layout_description: string;
  features: string[];
  position_x: number;
  position_y: number;
}

interface FlowConnection {
  id: string;
  source_id: string;
  target_id: string;
}

function UserFlowsContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { productSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPages, setGeneratedPages] = useState<FlowPage[]>([]);
  const [showPageSelection, setShowPageSelection] = useState(false);
  
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<any | null>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState<PageNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [undoStack, setUndoStack] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  
  const [productData, setProductData] = useState<{
    description: string;
    problem: string;
    solution: string;
  } | null>(null);
  
  const [showRefinementDialog, setShowRefinementDialog] = useState(false);
  const [selectedPages, setSelectedPages] = useState<FlowPage[]>([]);
  const [refinedPages, setRefinedPages] = useState<FlowPage[] | null>(null);
  const [isOptionalRefinement, setIsOptionalRefinement] = useState(false);
  
  const [showAddPageDialog, setShowAddPageDialog] = useState(false);
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [originalSelectedPages, setOriginalSelectedPages] = useState<FlowPage[]>([]);
  const [refinementResult, setRefinementResult] = useState<RefinementResponse | null>(null);
  const [showRefinementChanges, setShowRefinementChanges] = useState(false);
  const [isGeneratingLayout, setIsGeneratingLayout] = useState(false);

  useEffect(() => {
    async function loadFlowData() {
      if (!productSlug) {
        navigate('/');
        setLoading(false);
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
          .select('id, name, description')
          .eq('slug', productSlug)
          .eq('user_id', user.id)
          .single() as { data: Product | null; error: any };

        if (productError || !product) {
          console.error('Error loading product:', productError);
          navigate('/');
          return;
        }

        setProductId(product.id);

        const { data: prd, error: prdError } = await supabase
          .from('prds')
          .select('problem, solution')
          .eq('product_id', product.id)
          .single() as { data: PRD | null; error: any };

        if (prdError || !prd) {
          throw new Error('Failed to load PRD data');
        }

        setProductData({
          description: product.description || '',
          problem: prd.problem || '',
          solution: prd.solution || ''
        });

        const { data: pages, error: pagesError } = await supabase
          .from('flow_pages')
          .select('*')
          .eq('product_id', product.id) as { data: FlowPageDB[] | null; error: any };

        if (pagesError) {
          throw new Error('Failed to load flow pages');
        }

        const { data: connections, error: connectionsError } = await supabase
          .from('flow_connections')
          .select('id, source_id, target_id')
          .eq('product_id', product.id) as { data: FlowConnection[] | null; error: any };

        if (connectionsError) {
          throw new Error('Failed to load flow connections');
        }

        const flowNodes = (pages || []).map(page => ({
          id: page.id,
          type: 'page' as const,
          position: { x: page.position_x, y: page.position_y },
          data: {
            name: page.name,
            description: page.description || '',
            layout_description: page.layout_description || '',
            features: page.features || []
          }
        }));

        const flowEdges = (connections || []).map(conn => ({
          id: conn.id,
          source: conn.source_id,
          target: conn.target_id
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);
      } catch (error) {
        console.error('Error loading flow data:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    loadFlowData();
  }, [productSlug, user, navigate]);

  const onConnect = useCallback(async (params: Connection) => {
    try {
      if (!params.source || !params.target || !productId) return;

      setUndoStack(prev => [...prev, { nodes, edges }]);
      setRedoStack([]);

      const newEdge = {
        ...params,
        id: `e${Date.now()}`,
        type: 'default',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#7056A4',
        },
        animated: false
      };

      // First update the database
      const { error } = await supabase
        .from('flow_connections')
        .insert([{
          product_id: productId,
          source_id: params.source,
          target_id: params.target
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating connection:', error);
        setError('Failed to create connection. Please try again.');
        return;
      }

      // Then update the UI
      setEdges(eds => addEdge(newEdge, eds));
    } catch (error) {
      console.error('Error in onConnect:', error);
      setError('Failed to create connection. Please try again.');
    }
  }, [nodes, edges, productId, setEdges]);

  const handleNodesChange = (changes: NodeChange[]) => {
    if (changes.some(change => change.type !== 'select')) {
      setUndoStack(prev => [...prev, { nodes, edges }]);
      setRedoStack([]);
    }

    onNodesChange(changes);

    const positionChanges = changes.filter(change => 
      change.type === 'position' && change.position
    );

    if (positionChanges.length > 0 && productId) {
      updateNodePositions(positionChanges);
    }
  };

  const updateNodePositions = async (changes: NodeChange[]) => {
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
  };

  const handleEdgesChange = async (changes: EdgeChange[]) => {
    if (changes.some(change => change.type !== 'select')) {
      setUndoStack(prev => [...prev, { nodes, edges }]);
      setRedoStack([]);
    }

    onEdgesChange(changes);

    const removedEdges = changes.filter(change => change.type === 'remove');
    if (removedEdges.length > 0 && productId) {
      try {
        for (const change of removedEdges) {
          const { error } = await supabase
            .from('flow_connections')
            .delete()
            .eq('id', change.id);

          if (error) {
            console.error('Error deleting connection:', error);
            setError('Failed to delete connection. Please try again.');
            setEdges(prev => [...prev, edges.find(e => e.id === change.id)!]);
            return;
          }
        }
      } catch (error) {
        console.error('Error deleting connections:', error);
        setError('Failed to delete connections. Please try again.');
      }
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const lastState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, { nodes, edges }]);
    setUndoStack(prev => prev.slice(0, -1));
    setNodes(lastState.nodes);
    setEdges(lastState.edges);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, { nodes, edges }]);
    setRedoStack(prev => prev.slice(0, -1));
    setNodes(nextState.nodes);
    setEdges(nextState.edges);
  };

  const handleCreateFlow = async () => {
    if (!productId || !productData) return;

    try {
      setIsGenerating(true);
      setError(null);

      const { data: features, error: featuresError } = await supabase
        .from('features')
        .select('*')
        .eq('product_id', productId);

      if (featuresError) throw new Error('Failed to load features');

      const result = await generateUserFlow({
        productDescription: productData.description,
        problemStatement: productData.problem,
        solutionDescription: productData.solution,
        targetAudience: '',  // You'll need to add this to your productData if needed
        features: features || []
      });

      setGeneratedPages(result.pages);
      setShowPageSelection(true);
    } catch (error) {
      if (error instanceof OpenAIError) {
        setError(error.message);
      } else {
        setError('Failed to generate flow. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectPages = async (selectedPages: FlowPage[], additionalRequirements?: string) => {
    if (!productId || !productData) return;

    try {
      setIsGenerating(true);
      setError(null);
      setOriginalSelectedPages(selectedPages);

      // If there are additional requirements, use refinement flow
      if (additionalRequirements) {
        const { data: features, error: featuresError } = await supabase
          .from('features')
          .select('*')
          .eq('product_id', productId);

        if (featuresError) throw new Error('Failed to load features');

        const result = await refineUserFlow({
          productDescription: productData.description,
          problemStatement: productData.problem,
          solutionDescription: productData.solution,
          targetAudience: '',  // You'll need to add this to your productData if needed
          features: features || [],
          selectedPages,
          additionalRequirements
        });

        setRefinementResult(result);
        setShowRefinementChanges(true);
      } else {
        // No additional requirements, proceed directly to layout
        handleFinalizeFlow(selectedPages);
      }
    } catch (error) {
      if (error instanceof OpenAIError) {
        setError(error.message);
      } else {
        setError('Failed to process flow. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptRefinement = (refinedPages: FlowPage[]) => {
    setShowRefinementChanges(false);
    handleFinalizeFlow(refinedPages);
  };

  const handleRevertRefinement = () => {
    setShowRefinementChanges(false);
    handleFinalizeFlow(originalSelectedPages);
  };

  const handleStartOptionalRefinement = async () => {
    if (!productId || !productData) {
      setError('Missing product information. Please try again.');
      return;
    }
    
    try {
      setIsOptionalRefinement(true);
      setError(null);
      setRefinedPages(null);
      
      const { data: features, error: featuresError } = await supabase
        .from('features')
        .select('*')
        .eq('product_id', productId);
        
      if (featuresError) {
        throw new Error('Failed to load features for refinement');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setRefinedPages(selectedPages);
      
    } catch (error) {
      console.error('Refinement error:', error);
      if (error instanceof OpenAIError) {
        setError(error.message);
      } else {
        setError('Failed to refine flow. Please try again later.');
      }
      setRefinedPages(null);
    } finally {
      setIsOptionalRefinement(false);
    }
  };

  const handleFinalizeFlow = async (finalPages: FlowPage[]) => {
    if (!productId) return;
    
    try {
      setIsGeneratingLayout(true);
      setError(null);
      // Close all dialogs
      setShowPageSelection(false);
      setShowRefinementDialog(false);
      setShowRefinementChanges(false);
      setShowReviewDialog(false);
      
      const layout = await generateFlowLayout(finalPages, 'auto');
      
      const { error: deleteError } = await supabase
        .from('flow_pages')
        .delete()
        .eq('product_id', productId);
      
      if (deleteError) throw deleteError;
      
      const pageMap = new Map<string, string>();
      
      for (const page of layout.pages) {
        const selectedPage = finalPages.find(p => p.name === page.name);
        const { data: pageData, error: pageError } = await supabase
          .from('flow_pages')
          .insert({
            product_id: productId,
            name: page.name,
            description: selectedPage?.description || '',
            layout_description: selectedPage?.layout_description || '',
            features: selectedPage?.features || [],
            position_x: page.position.x,
            position_y: page.position.y
          })
          .select()
          .single();
        
        if (pageError) throw pageError;
        pageMap.set(page.id, pageData.id);
      }
      
      for (const conn of layout.connections) {
        const sourceId = pageMap.get(conn.source);
        const targetId = pageMap.get(conn.target);
        
        if (!sourceId || !targetId) continue;
        
        const { error: connectionError } = await supabase
          .from('flow_connections')
          .insert({
            product_id: productId,
            source_id: sourceId,
            target_id: targetId
          });
        
        if (connectionError) throw connectionError;
      }
      
      const { data: pages, error: loadPagesError } = await supabase
        .from('flow_pages')
        .select('*')
        .eq('product_id', productId);
      
      if (loadPagesError) throw loadPagesError;
      
      const { data: connections, error: loadConnectionsError } = await supabase
        .from('flow_connections')
        .select('id, source_id, target_id')
        .eq('product_id', productId);
      
      if (loadConnectionsError) throw loadConnectionsError;
      
      const flowNodes = pages.map(page => ({
        id: page.id,
        type: 'page',
        position: { x: page.position_x, y: page.position_y },
        data: {
          name: page.name,
          description: page.description || '',
          layout_description: page.layout_description || '',
          features: page.features || []
        }
      }));
      
      const flowEdges = connections.map(conn => ({
        id: conn.id,
        source: conn.source_id,
        target: conn.target_id
      }));
      
      setNodes(flowNodes);
      setEdges(flowEdges);
      
    } catch (error) {
      console.error('Error finalizing flow:', error);
      if (error instanceof OpenAIError) {
        setError(error.message);
      } else {
        setError('Failed to generate flow. Please try again.');
      }
    } finally {
      setIsGeneratingLayout(false);
    }
  };

  const handleAddPage = async (pageData: PageData) => {
    if (!productId) return;
    
    try {
      setIsAddingPage(true);
      setError(null);
      
      const defaultX = 100;
      const defaultY = 100;
      
      const existingPositions = nodes.map(node => ({
        x: node.position.x,
        y: node.position.y
      }));
      
      let x = defaultX;
      let y = defaultY;
      let offset = 0;
      
      while (existingPositions.some(pos => 
        Math.abs(pos.x - x) < 250 && Math.abs(pos.y - y) < 150
      )) {
        offset += 50;
        x = defaultX + offset;
        y = defaultY + offset;
      }
      
      const { data: pageResult, error: pageError } = await supabase
        .from('flow_pages')
        .insert({
          product_id: productId,
          name: pageData.name,
          description: pageData.description,
          layout_description: pageData.layout_description,
          features: pageData.features,
          position_x: x,
          position_y: y
        })
        .select()
        .single();
        
      if (pageError) throw pageError;
      
      const newNode = {
        id: pageResult.id,
        type: 'page' as const,
        position: { x, y },
        data: {
          name: pageData.name,
          description: pageData.description,
          layout_description: pageData.layout_description,
          features: pageData.features
        }
      };
      
      setUndoStack(prev => [...prev, { nodes, edges }]);
      setRedoStack([]);
      
      setNodes(prev => [...prev, newNode]);
      
      setShowAddPageDialog(false);
      
    } catch (error) {
      console.error('Error adding page:', error);
      setError('Failed to add page. Please try again.');
    } finally {
      setIsAddingPage(false);
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    try {
      setDeleteFeatureId(featureId);
      setShowDeleteDialog(true);
    } catch (error) {
      console.error('Error showing delete dialog:', error);
    }
  };

  if (loading || isGeneratingLayout) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-purple mx-auto mb-4" />
          <p className="text-xl font-medium text-gray-900">
            {isGeneratingLayout ? 'Generating Flow Layout...' : 'Loading...'}
          </p>
          <p className="text-gray-600 mt-2">
            {isGeneratingLayout ? 'This may take a few moments' : 'Loading user flows...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-16rem)]">
      <PageTitle title="User Flows" />
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 mb-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">User Flows</h1>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="shrink-0"
          >
            <Undo className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="shrink-0"
          >
            <Redo className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddPageDialog(true)}
            className="shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Page
          </Button>
          
          <Button
            variant="secondary"
            onClick={handleCreateFlow}
            disabled={isGenerating}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Flow
              </span>
            )}
          </Button>
        </div>
      </div>
      
      <div className="w-full h-full border rounded-lg overflow-hidden bg-white">
        <ReactFlow
          nodes={nodes}
          edges={edges.map(edge => ({
            ...edge,
            type: 'default',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: edge.selected ? '#5D4A8C' : '#7056A4',
            },
            animated: false,
            data: {
              onDelete: (edgeId: string) => {
                const edgeChange: EdgeChange = {
                  type: 'remove',
                  id: edgeId,
                };
                handleEdgesChange([edgeChange]);
              }
            }
          }))}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          deleteKeyCode="Delete"
          fitView
          fitViewOptions={{
            padding: 0.5,
            minZoom: 0.5,
            maxZoom: 1.5
          }}
          minZoom={0.2}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
          snapToGrid
          snapGrid={[15, 15]}
          defaultEdgeOptions={{
            type: 'default',
            animated: false,
            style: { stroke: '#7056A4' }
          }}
          connectionMode="loose"
          elevateNodesOnSelect
          selectNodesOnDrag={false}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
      
      <FlowGenerationDialog
        isOpen={showPageSelection}
        onClose={() => setShowPageSelection(false)}
        pages={generatedPages}
        onConfirm={handleSelectPages}
        isLoading={isGenerating}
        error={error}
      />
      
      <FlowReviewDialog
        isOpen={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
        reviewResult={reviewResult}
        isLoading={isReviewing}
        error={reviewError}
        onAcceptReview={handleSelectPages}
      />
      
      <OptionalRefinementDialog
        isOpen={showRefinementDialog}
        onClose={() => setShowRefinementDialog(false)}
        selectedPages={selectedPages}
        onRefinementComplete={handleFinalizeFlow}
        isRefining={isOptionalRefinement}
        refinementError={error}
        refinedPages={refinedPages}
        error={error}
        onStartRefinement={handleStartOptionalRefinement}
      />
      
      <RefinementChangesDialog
        isOpen={showRefinementChanges}
        onClose={() => setShowRefinementChanges(false)}
        refinementResult={refinementResult}
        onAccept={handleAcceptRefinement}
        onRevert={handleRevertRefinement}
        error={error}
      />
      
      <AddPageDialog
        isOpen={showAddPageDialog}
        onClose={() => setShowAddPageDialog(false)}
        onAddPage={handleAddPage}
        isLoading={isAddingPage}
        error={error}
      />
    </div>
  );
}

export function UserFlows() {
  return (
    <ReactFlowProvider>
      <UserFlowsContent />
    </ReactFlowProvider>
  );
}