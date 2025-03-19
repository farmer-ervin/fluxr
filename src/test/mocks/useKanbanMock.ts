import { vi } from 'vitest';
import { generateMockItems } from '../utils';

// Default mock state for useKanban
const defaultMockState = {
  items: [
    ...generateMockItems(3, 'feature'),
    ...generateMockItems(2, 'page'),
    ...generateMockItems(2, 'bug'),
    ...generateMockItems(2, 'task')
  ],
  loading: false,
  error: null,
  filters: {
    types: new Set<string>(),
    priorities: new Set<string>()
  },
  activeFilters: 0,
  onTypeFilterChange: vi.fn(),
  onPriorityFilterChange: vi.fn(),
  onClearFilters: vi.fn(),
  addItem: vi.fn(async (newItem) => {
    const mockId = `test-${newItem.type}-${Math.floor(Math.random() * 1000)}`;
    return {
      ...newItem,
      id: mockId,
      implementation_status: 'not_started',
      position: 0
    };
  }),
  updateItem: vi.fn(async (itemId, updates) => {
    return { id: itemId, ...updates };
  }),
  deleteItem: vi.fn(async () => {
    return true;
  }),
};

// Creator function to customize the mock
export function createKanbanMock(customState = {}) {
  return {
    ...defaultMockState,
    ...customState,
  };
}

// Mock the hook
export function mockUseKanban(customState = {}) {
  const mockState = createKanbanMock(customState);
  
  vi.mock('@/hooks/useKanban', () => ({
    useKanban: () => mockState
  }));
  
  return mockState;
}

export default mockUseKanban; 