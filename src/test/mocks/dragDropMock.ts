import { vi } from 'vitest';

// Create onDragEnd handler storage
let globalDragEndHandler: Function;

// Mock for @hello-pangea/dnd
vi.mock('@hello-pangea/dnd', () => {
  const mockDragDropContext = ({ children, onDragEnd }: any) => {
    // Store the callback for direct access in tests
    if (onDragEnd) {
      globalDragEndHandler = onDragEnd;
      (window as any).__dragDropContextOnDragEnd = onDragEnd;
    }
    return children;
  };

  const mockDroppable = ({ children, droppableId }: any) => {
    const provided = {
      innerRef: vi.fn(),
      droppableProps: {
        'data-rbd-droppable-id': droppableId,
        'data-rbd-droppable-context-id': '1',
      },
      placeholder: null,
    };
    return children(provided, { isDraggingOver: false });
  };

  const mockDraggable = ({ children, draggableId, index }: any) => {
    const provided = {
      innerRef: vi.fn(),
      draggableProps: {
        'data-rbd-draggable-id': draggableId,
        'data-rbd-draggable-context-id': '1',
        style: {},
      },
      dragHandleProps: {
        'data-rbd-drag-handle-draggable-id': draggableId,
        'data-rbd-drag-handle-context-id': '1',
        'aria-labelledby': `draggable-${draggableId}`,
        role: 'button',
        tabIndex: 0,
      },
    };
    return children(provided, { isDragging: false, draggingOver: null });
  };

  return {
    DragDropContext: mockDragDropContext,
    Droppable: mockDroppable,
    Draggable: mockDraggable,
  };
});

// Helper function to simulate drag and drop in tests
export const simulateDragDrop = (
  itemId: string,
  sourceColumnId: string,
  sourceIndex: number,
  destinationColumnId: string,
  destinationIndex: number
) => {
  if (!globalDragEndHandler) {
    throw new Error('DragDropContext onDragEnd not found. Make sure you rendered the component.');
  }

  // Simulate drag and drop event
  const dragEndEvent = {
    draggableId: itemId,
    type: 'DEFAULT',
    source: {
      droppableId: sourceColumnId,
      index: sourceIndex,
    },
    destination: {
      droppableId: destinationColumnId,
      index: destinationIndex,
    },
    reason: 'DROP',
  };

  // Call the onDragEnd handler directly
  globalDragEndHandler(dragEndEvent);

  return dragEndEvent;
};

// Access or set the dragEndHandler directly (useful for specific tests)
export const getDragEndHandler = () => globalDragEndHandler;
export const setDragEndHandler = (handler: Function) => {
  globalDragEndHandler = handler;
  (window as any).__dragDropContextOnDragEnd = handler;
}; 