import { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase, handleSupabaseError } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  isWelcomePopupVisible: boolean;
  setWelcomePopupVisible: (visible: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initAttempts, setInitAttempts] = useState(0);
  const [isWelcomePopupVisible, setWelcomePopupVisible] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleAuthError = (error: any) => {
    console.warn('Auth error detected:', error);
    
    // Handle session not found errors by signing out
    if (error?.message?.includes('session_not_found') || 
        error?.body?.includes('session_not_found') ||
        error?.error?.includes('session_not_found') ||
        error?.code === 'refresh_token_not_found') {
      console.log('Invalid session detected, signing out');
      // Clear local session data
      localStorage.removeItem('fluxr_current_product');
      localStorage.removeItem('sb-' + supabase.supabaseUrl + '-auth-token');
      setUser(null);
      
      // Clear supabase session without making additional API calls
      supabase.auth.signOut({ scope: 'local' }).catch(err => {
        console.warn('Error during forced sign out:', err);
      });
      
      setError('Your session has expired. Please sign in again.');
      setLoading(false);
      return;
    }

    // Handle network-related errors
    if (error?.name === 'AuthRetryableFetchError' || isOffline) {
      setError('Connection issue detected. Please check your internet connection and try again.');
      return;
    }
    
    // Handle invalid credentials specifically
    if (error?.code === 'invalid_credentials') {
      setError('Invalid email or password. Please try again.');
      return;
    }
    
    // Handle other auth errors
    const formattedError = handleSupabaseError(error);
    setError(formattedError.message);
  };

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        setLoading(true);
        
        // If offline, don't try to fetch the session
        if (isOffline) {
          setError('You appear to be offline. Some features may be unavailable.');
          setLoading(false);
          return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Session retrieval error:', error);
          
          // Handle session errors
          handleAuthError(error);
          
          // If we get a server error, try a few times with increasing delay
          if (error.status === 503 && initAttempts < 3) {
            const retryDelay = Math.pow(2, initAttempts) * 1000;
            console.log(`Retrying auth initialization in ${retryDelay}ms`);
            
            setInitAttempts(prev => prev + 1);
            setTimeout(initAuth, retryDelay);
            return;
          }
          
          // If we have an error after retries, set the error message but don't block the app
          setError(handleSupabaseError(error).message);
        }
        
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('Auth initialization error:', err);
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, !!session);
      
      // Handle sign up event
      if (event === 'SIGNED_UP') {
        console.log('New user signed up, showing welcome popup');
        setWelcomePopupVisible(true);
      }
      
      // Set user state
      setUser(session?.user ?? null);
      
      // Handle sign out or user deletion events
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        // Clear local storage on signout to prevent stale data
        localStorage.removeItem('fluxr_current_product');
        localStorage.removeItem('sb-' + supabase.supabaseUrl + '-auth-token');
      }
      
      // Clear any auth errors when the state changes
      if (error) {
        setError(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initAttempts, isOffline]);

  const signIn = async (email: string, password: string, rememberMe = false) => {
    try {
      setError(null);
      
      // Check if offline
      if (isOffline) {
        throw new Error('You appear to be offline. Please check your internet connection and try again.');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          persistSession: rememberMe,
        },
      });
      
      if (error) throw handleSupabaseError(error);
      
      return data;
    } catch (error) {
      handleAuthError(error);
      const formattedError = error instanceof Error ? error : new Error('An unexpected error occurred');
      throw formattedError;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setError(null);
      
      // Check if offline
      if (isOffline) {
        throw new Error('You appear to be offline. Please check your internet connection and try again.');
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw handleSupabaseError(error);
      
      // Show welcome popup immediately after successful sign up
      setWelcomePopupVisible(true);
      
      return data;
    } catch (error) {
      handleAuthError(error);
      const formattedError = error instanceof Error ? error : new Error('An unexpected error occurred');
      throw formattedError;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      
      // First clear local state and storage
      setUser(null);
      localStorage.removeItem('fluxr_current_product');
      localStorage.removeItem('sb-' + supabase.supabaseUrl + '-auth-token');
      
      // Then attempt to sign out from Supabase
      try {
        // Try global sign out first
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        
        if (error) {
          // If global sign out fails, try local sign out
          console.warn('Global sign out failed, falling back to local:', error);
          await supabase.auth.signOut({ scope: 'local' });
        }
      } catch (err) {
        // If both attempts fail, just log it - we've already cleared local state
        console.warn('Sign out error:', err);
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      // Don't rethrow - we want to always consider sign out successful from the UI perspective
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      
      // Check if offline
      if (isOffline) {
        throw new Error('You appear to be offline. Please check your internet connection and try again.');
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw handleSupabaseError(error);
    } catch (error) {
      handleAuthError(error);
      const formattedError = error instanceof Error ? error : new Error('An unexpected error occurred');
      throw formattedError;
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        clearError,
        isWelcomePopupVisible,
        setWelcomePopupVisible
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}