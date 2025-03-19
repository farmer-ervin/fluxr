import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock AuthProvider
vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    isLoading: false,
    error: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock useParams with the required productSlug
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({
      productSlug: 'subtracker-2',
    }),
  };
});

// Extended interface for customRender options
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  // Add more custom options as needed
}

// Custom render function that wraps component with providers
function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const {
    route = '/',
    ...renderOptions
  } = options || {};

  // Set window.location before rendering
  window.history.pushState({}, 'Test page', route);

  return render(ui, {
    wrapper: ({ children }) => (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    ),
    ...renderOptions,
  });
}

// Mock drag and drop functionality
const mockDragAndDrop = async (
  dragItem: HTMLElement,
  dropTarget: HTMLElement,
  userEvent: any
) => {
  // Simulate drag start
  await userEvent.hover(dragItem);
  await userEvent.pointer({ target: dragItem, keys: '[MouseLeft>]' });
  
  // Move to drop target
  await userEvent.hover(dropTarget);
  
  // Simulate drop
  await userEvent.pointer({ target: dropTarget, keys: '[/MouseLeft]' });
};

// Mock data generators
const generateMockItems = (count = 5, type: 'feature' | 'page' | 'bug' | 'task' = 'feature') => {
  return Array.from({ length: count }, (_, i) => ({
    id: `test-${type}-${i}`,
    name: `Test ${type} ${i}`,
    description: `Description for test ${type} ${i}`,
    priority: i % 3 === 0 ? 'must-have' : i % 3 === 1 ? 'nice-to-have' : 'not-prioritized',
    implementation_status: i % 3 === 0 ? 'not_started' : i % 3 === 1 ? 'in_progress' : 'completed',
    position: i,
    type,
  }));
};

// Export utilities
export {
  customRender as render,
  mockDragAndDrop,
  generateMockItems,
};

// Re-export everything from testing-library
export * from '@testing-library/react'; 