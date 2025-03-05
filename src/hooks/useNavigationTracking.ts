import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { trackPageView, trackNavigation, trackTimeSpentOnPage } from '@/lib/analytics';

export function useNavigationTracking() {
  const location = useLocation();
  const navigate = useNavigate();
  const previousPath = location.pathname;

  useEffect(() => {
    // Track page view
    trackPageView(location.pathname, window.location.href);

    // Track navigation if there's a previous path
    if (previousPath && previousPath !== location.pathname) {
      trackNavigation(previousPath, location.pathname);
    }

    // Set up time tracking
    const startTime = Date.now();
    return () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000); // Convert to seconds
      trackTimeSpentOnPage(location.pathname, timeSpent);
    };
  }, [location.pathname, previousPath]);

  return navigate;
} 