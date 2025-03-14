import { createClient, AuthError } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Configure retry logic
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

// Create a custom fetch with retry logic for handling transient errors
const customFetch = async (url: string, options: RequestInit) => {
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < MAX_RETRIES) {
    try {
      // Set timeout for fetch requests
      const timeout = 15000; // 15 seconds timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Check for session errors early and handle separately
      if (response.status === 403) {
        const responseData = await response.json();
        
        if (responseData?.code === 'session_not_found' || 
            responseData?.error === 'session_not_found' || 
            responseData?.message?.includes('session_not_found')) {
          // Let the auth provider handle this specific error
          const error = new Error('Session not found');
          error.name = 'AuthSessionError';
          // @ts-ignore
          error.body = JSON.stringify(responseData);
          throw error;
        }
      }
      
      // Handle rate limiting (429) with special backoff
      if (response.status === 429) {
        // Try to get retry-after header, or default to increasing backoff
        const retryAfter = parseInt(response.headers.get('retry-after') || '0', 10);
        const backoffTime = retryAfter > 0 ? retryAfter * 1000 : INITIAL_BACKOFF_MS * Math.pow(2, retries);
        
        console.log(`Rate limited, retrying after ${backoffTime}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        retries++;
        continue;
      }
      
      // For 503 errors, use exponential backoff
      if (response.status === 503) {
        const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, retries);
        console.log(`Service unavailable (503), retrying after ${backoffTime}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        retries++;
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on aborted requests
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      
      // Don't retry auth session errors
      if (error.name === 'AuthSessionError') {
        throw error;
      }
      
      // Use exponential backoff for network errors
      const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, retries);
      console.log(`Network error, retrying after ${backoffTime}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      retries++;
    }
  }
  
  // If we've exhausted retries, throw the last error
  throw lastError || new Error('Request failed after maximum retries');
};

// Create the Supabase client with enhanced configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' // More secure authentication flow
  },
  global: {
    fetch: customFetch,
    headers: {
      'X-Client-Info': 'supabase-js/2.39.7'
    },
  },
  // Reduce realtime events to avoid overwhelming the service
  realtime: {
    params: {
      eventsPerSecond: 1
    }
  }
});

// Track connection status to help with error recovery
let isOffline = false;
window.addEventListener('online', () => {
  if (isOffline) {
    console.log('Internet connection restored, refreshing authentication');
    isOffline = false;
    // Force refresh token when connection is restored
    supabase.auth.getSession().catch(err => {
      console.warn('Failed to refresh session after reconnect:', err);
    });
  }
});
window.addEventListener('offline', () => {
  console.log('Internet connection lost, entering offline mode');
  isOffline = true;
});

// Add a handler for auth state changes and errors
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, !!session);
  
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    // Clear local storage on signout to prevent stale data
    localStorage.removeItem('fluxr_current_product');
  }
});

// Utility function to handle Supabase errors consistently
export const handleSupabaseError = (error: any): Error => {
  console.error('Supabase error:', error);
  
  // Handle specific error types with user-friendly messages
  let message: string;
  
  if (error?.status === 503) {
    message = "Server is temporarily unavailable. Please check your connection and try again in a moment.";
  } else if (error?.status === 429) {
    message = "Too many requests. Please wait a moment and try again.";
  } else if (error?.code === 'PGRST116') {
    message = "You don't have permission to perform this action.";
  } else if (error?.message?.includes('Invalid login credentials')) {
    message = "Email or password is incorrect. Please try again.";
  } else if (error?.message?.includes('Email not confirmed')) {
    message = "Please confirm your email address before signing in.";
  } else if (error?.name === 'AuthRetryableFetchError' || isOffline) {
    message = "Connection issue detected. Please check your internet connection and try again.";
  } else if (error?.message?.includes('session_not_found') || 
             error?.body?.includes('session_not_found') ||
             error?.error?.includes('session_not_found')) {
    message = "Your session has expired. Please sign in again.";
  } else {
    message = error?.message || error?.error_description || "An unexpected error occurred";
  }
  
  return new Error(message);
};

/**
 * Custom function for making authenticated requests to Supabase with additional reliability
 */
export async function fetchWithSupabase(path: string, options: RequestInit = {}) {
  const session = (await supabase.auth.getSession()).data.session;
  
  if (!session) {
    throw new Error('Authentication required');
  }
  
  const url = `${supabaseUrl}${path}`;
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${session.access_token}`,
    'apikey': supabaseAnonKey,
  };
  
  try {
    return await customFetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

export type { Database };