import { vi } from 'vitest';

// Create a comprehensive mock for mixpanel
const mixpanelMock = {
  // Core API
  init: vi.fn(),
  track: vi.fn(),
  track_links: vi.fn(),
  track_forms: vi.fn(),
  time_event: vi.fn(),
  identify: vi.fn(),
  alias: vi.fn(),
  reset: vi.fn(),
  get_distinct_id: vi.fn().mockReturnValue('test-user-id'),
  get_property: vi.fn(),
  
  // People API
  people: {
    set: vi.fn(),
    set_once: vi.fn(),
    increment: vi.fn(),
    append: vi.fn(),
    track_charge: vi.fn(),
    clear_charges: vi.fn(),
    delete_user: vi.fn(),
    union: vi.fn(),
    unset: vi.fn(),
    remove: vi.fn(),
  },
  
  // Group API
  group: {
    set: vi.fn(),
    set_once: vi.fn(),
    union: vi.fn(),
    unset: vi.fn(),
    remove: vi.fn(),
  },
  
  // Config
  get_config: vi.fn().mockReturnValue({}),
  set_config: vi.fn(),
  
  // For the new browser-specific methods
  opt_out_tracking: vi.fn(),
  opt_in_tracking: vi.fn(),
  has_opted_out_tracking: vi.fn().mockReturnValue(false),
  has_opted_in_tracking: vi.fn().mockReturnValue(true),
  clear_opt_in_out_tracking: vi.fn(),
  disable: vi.fn(),
  
  // Register/Unregister
  register: vi.fn(),
  register_once: vi.fn(),
  unregister: vi.fn(),
};

// Set up the mocks for both the default export and the named exports
const setupMixpanelMocks = () => {
  // Mock mixpanel-browser
  vi.mock('mixpanel-browser', () => {
    return {
      default: mixpanelMock,
      init: mixpanelMock.init,
      track: mixpanelMock.track,
    };
  });
  
  // Mock our own mixpanel implementation
  vi.mock('@/lib/mixpanel', () => {
    return {
      default: mixpanelMock,
      track: vi.fn(),
      identifyUser: vi.fn(),
      updateUserProfile: vi.fn(),
      resetUser: vi.fn(),
    };
  });
  
  // Mock all analytics functions
  vi.mock('@/lib/analytics', () => {
    return {
      trackPageView: vi.fn(),
      trackNavigation: vi.fn(),
      trackTimeSpentOnPage: vi.fn(),
      trackEvent: vi.fn(),
      trackError: vi.fn(),
    };
  });

  return mixpanelMock;
};

export { mixpanelMock, setupMixpanelMocks }; 