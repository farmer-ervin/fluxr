import React, { useState } from 'react';
import { useReactFlow } from 'reactflow';
import { MagicWand, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FlowPatternDialog, FlowPattern } from './FlowPatternDialog';
import { FlowReviewDialog } from './FlowReviewDialog';
import { OptionalRefinementDialog } from './OptionalRefinementDialog';
import { supabase } from '@/lib/supabase';
import { reviewUserFlow, generateFlowLayout, FlowPage, OpenAIError } from '@/lib/openai';

interface RefineExistingFlowButtonProps {
  productId: string | null;
  productData: any;
  prdData: any;
  features: any[];
  onRefineComplete: (nodes: any[], edges: any[]) => void;
}

export function RefineExistingFlowButton({
  productId,
  productData,
  prdData,
  features,
  onRefineComplete
}: RefineExistingFlowButtonProps) {
  const { getNodes } = useReactFlow();
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFlowPatternDialog, setShowFlowPatternDialog] = useState(false);
  const [selectedFlowPattern, setSelectedFlowPattern] = useState<FlowPattern>('auto');
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [showRefinementDialog, setShowRefinementDialog] = useState(false);
  const [selectedPages, setSelectedPages] = useState<FlowPage[]>([]);
  const [refinedPages, setRefinedPages] = useState<FlowPage[] | null>(null);
  const [isOptionalRefinement, setIsOptionalRefinement] = useState(false);
  
  const handleRefineClick = () => {
    setShowFlowPatternDialog(true);
  };
  
  const handleSelectFlowPattern = (pattern: FlowPattern) => {
    setSelectedFlowPattern(pattern);
  };
  
  const handleStartRefinement = async () => {
    if (!productId || !productData || !prdData) return;
    
    try {
      setIsRefining(true);
      setError(null);
      
      // Convert current nodes to FlowPage format
      const nodes = getNodes();
      const currentPages: FlowPage[] = nodes.map(node => ({
        name: node.data.name,
        description: node.data.description || '',
        layout_description: node.data.layout_description || '',
        features: node.data.features || []
      }));
      
      // Start the review process
      const result = await reviewUserFlow(
        currentPages,
        productData.description || '',
        prdData.problem || '',
        prdData.solution || '',
        features || [],
        selectedFlowPattern
      );
      
      setReviewResult(result);
      setShowFlowPatternDialog(false);
      setShowReviewDialog(true);
    } catch (error) {
      // Handle user-friendly error message
      if (error instanceof OpenAIError) {
        setError(error.message);
      } else {
        setError('Failed to review flow. Please try again later.');
      }
    } finally {
      setIsRefining(false);
    }
  };
  
  const handleAcceptReview = (improvedPages: FlowPage[]) => {
    setSelectedPages(improvedPages);
    setShowReviewDialog(false);
    setShowRefinementDialog(true);
  };
  
  const handleStartOptionalRefinement = async () => {
    if (!productId || !productData || !prdData) return;
    
    try {
      setIsOptionalRefinement(true);
      setError(null);
      
      // This would be a more focused refinement after user selection
      // For now, we'll simulate this by just passing the same pages through
      // In a real implementation, you'd call another OpenAI function
      setRefinedPages(selectedPages);
      
      // Simulate a delay to show the refinement process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
    } catch (error) {
      if (error instanceof OpenAIError) {
        setError(error.message);
      } else {
        setError('Failed to refine flow. Please try again later.');
      }
    } finally {
      setIsOptionalRefinement(false);
    }
  };
  
  const handleFinalizeFlow = async (finalPages: FlowPage[]) => {
    if (!productId) return;
    
    try {
      setIsRefining(true);
      setError(null);
      
      // Generate layout for selected pages with the selected flow pattern
      const layout = await generateFlowLayout(finalPages, selectedFlowPattern);
      
      // Clear existing flow
      const { error: deleteError } = await supabase
        .from('flow_pages')
        .delete()
        .eq('product_id', productId);
      
      if (deleteError) throw deleteError;
      
      // Create pages with positions
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
      
      // Create connections
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
      
      // Reload the flow
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
      
      // Update React Flow
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
      
      onRefineComplete(flowNodes, flowEdges);
      setShowRefinementDialog(false);
      
    } catch (error) {
      if (error instanceof OpenAIError) {
        setError(error.message);
      } else {
        setError('Failed to generate flow. Please try again.');
      }
    } finally {
      setIsRefining(false);
    }
  };
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefineClick}
        disabled={isRefining}
        className="flex items-center gap-2"
      >
        {isRefining ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MagicWand className="w-4 h-4" />
        )}
        Refine Existing Flow
      </Button>
      
      {/* Flow Pattern Selection Dialog */}
      <FlowPatternDialog
        isOpen={showFlowPatternDialog}
        onClose={() => setShowFlowPatternDialog(false)}
        selectedPattern={selectedFlowPattern}
        onSelectPattern={handleSelectFlowPattern}
        onConfirm={handleStartRefinement}
      />
      
      {/* AI Review Dialog */}
      <FlowReviewDialog
        isOpen={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
        reviewResult={reviewResult}
        isLoading={isRefining}
        error={error}
        onAcceptReview={handleAcceptReview}
      />
      
      {/* Optional Refinement Dialog */}
      <OptionalRefinementDialog
        isOpen={showRefinementDialog}
        onClose={() => setShowRefinementDialog(false)}
        selectedPages={selectedPages}
        onRefinementComplete={handleFinalizeFlow}
        isRefining={isOptionalRefinement}
        refinementError={error}
        refinedPages={refinedPages}
      />
    </>
  );
}