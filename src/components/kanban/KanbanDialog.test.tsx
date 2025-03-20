import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KanbanDialog } from './KanbanDialog';

// Override dynamic imports that might use Mixpanel
vi.mock('@/lib/mixpanel', () => ({
  default: {
    track: vi.fn(),
  },
  identifyUser: vi.fn(),
  updateUserProfile: vi.fn(),
  resetUser: vi.fn(),
}));

vi.mock('@/lib/analytics', () => ({
  trackPageView: vi.fn(),
  trackNavigation: vi.fn(),
  trackTimeSpentOnPage: vi.fn(),
  trackEvent: vi.fn(),
  trackError: vi.fn(),
}));

describe('KanbanDialog basic functionality', () => {
  const user = userEvent.setup();
  
  // Common props
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders correctly for feature type', () => {
    render(
      <KanbanDialog 
        type="feature"
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
        error={null}
      />
    );
    
    // Be more specific by checking for the heading
    expect(screen.getByRole('heading', { name: /add feature/i })).toBeInTheDocument();
    
    // Check for form fields specific to features
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
  });
  
  it('closes when cancel button is clicked', async () => {
    render(
      <KanbanDialog 
        type="feature"
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isLoading={false}
        error={null}
      />
    );
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });
}); 