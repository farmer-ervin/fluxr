import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ProductProvider } from './components/context/ProductContext';
import { useProduct } from './components/context/ProductContext';
import { ProductDetails } from './pages/ProductDetails';
import { PrdEditor } from './pages/PrdEditor';
import { UserFlows } from './pages/UserFlows';
import { ProfileSettings } from './pages/ProfileSettings';
import { CustomerProfiles } from './pages/CustomerProfiles';
import { KanbanBoard } from './pages/KanbanBoard';
import { PromptLibrary } from './pages/PromptLibrary';
import { NotesPanel } from './pages/NotesPanel';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { AuthModal } from './components/auth/AuthModal';
import { PaymentWall } from './components/auth/PaymentWall';
import { WelcomePopup } from './components/WelcomePopup';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { checkSubscriptionStatus } from '@/lib/subscription';
import { AlertTriangle, Check } from 'lucide-react';
import { clearSubscriptionCache } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useNavigationTracking } from '@/hooks/useNavigationTracking';
import TestPage from './pages/test';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/context/ThemeProvider';

function PaymentReturn() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [status, setStatus] = useState<'loading' | 'verifying' | 'success' | 'error'>('loading');
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  const verifySession = async (sessionId: string) => {
    try {
      setStatus('verifying');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        throw new Error('No active session');
      }

      // Verify the session directly with Stripe
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ session_id: sessionId })
      });

      if (!response.ok) {
        throw new Error('Failed to verify session');
      }

      const data = await response.json();
      
      if (data.status !== 'complete') {
        throw new Error('Payment not completed');
      }
      
      setStatus('success');
      
      // Start countdown
      let count = 3;
      const countdownInterval = setInterval(() => {
        count--;
        setRedirectCountdown(count);
        if (count === 0) {
          clearInterval(countdownInterval);
          navigate('/');
        }
      }, 1000);
      
      return true;
    } catch (err) {
      setStatus('error');
      throw new Error('Payment verification failed');
    }
  };

  useEffect(() => {
    const handlePaymentReturn = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const sessionId = searchParams.get('session_id');

        if (!sessionId || sessionId === '{CHECKOUT_SESSION_ID}') {
          throw new Error('Invalid return URL');
        }

        // Verify the session and complete the payment
        await verifySession(sessionId);
        
        // Clear subscription cache
        clearSubscriptionCache();
      } catch (err) {
        setError(err.message);
        setStatus('error');
      } finally {
        setIsProcessing(false);
      }
    };

    handlePaymentReturn();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <h3 className="font-semibold mb-1">Payment Error</h3>
              <p>{error}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/payment')}
            className="w-full"
          >
            Return to Payment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4 text-center">
        {status === 'success' ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your purchase. You now have lifetime access to all features.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to dashboard in {redirectCountdown} seconds...
            </p>
          </>
        ) : (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-brand-purple mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {status === 'verifying' ? 'Verifying Payment' : 'Processing Payment'}
            </h2>
            <p className="text-gray-600">
              {status === 'verifying' 
                ? 'Please wait while we verify your payment...'
                : 'Please wait while we process your payment...'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function NetworkErrorBanner() {
  const { error, clearError } = useAuth();
  
  if (!error) return null;
  
  const isConnectionError = error.includes('unavailable') || 
                          error.includes('connection') ||
                          error.includes('offline');
  
  if (!isConnectionError) return null;
  
  return (
    <div className="bg-yellow-50 text-yellow-800 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <span>{error}</span>
      </div>
      <button 
        onClick={clearError}
        className="text-yellow-700 hover:text-yellow-900 text-sm font-medium"
      >
        Dismiss
      </button>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isWelcomePopupVisible, setWelcomePopupVisible } = useAuth();
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <>
      <NetworkErrorBanner />
      <WelcomePopup 
        isOpen={isWelcomePopupVisible} 
        onClose={() => setWelcomePopupVisible(false)} 
      />
      {children}
    </>
  );
}

function AuthPage() {
  const { user, loading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(true);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <NetworkErrorBanner />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => {}} />
    </div>
  );
}

// Route to handle auth callback redirects
function AuthCallback() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Parse the URL hash and handle the authentication tokens
    const handleAuthCallback = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) {
          console.error('Auth callback error:', error);
        }
      } catch (err) {
        console.error('Exception during auth callback:', err);
      } finally {
        // Always redirect to home page after handling auth
        navigate('/');
      }
    };
    
    handleAuthCallback();
  }, [navigate]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
      <p className="ml-2 text-gray-600">Completing authentication...</p>
    </div>
  );
}

function AppRoutes() {
  const { user, isWelcomePopupVisible, setWelcomePopupVisible } = useAuth();
  useNavigationTracking();

  return (
    <Layout>
      <Routes>
        <Route path="/test" element={<TestPage />} />
        <Route
          path="/"
          element={
            user ? (
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            ) : (
              <AuthPage />
            )
          }
        />
        <Route
          path="/product/new"
          element={
            <ProtectedRoute>
              <ProductDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/:productSlug/prd"
          element={
            <ProtectedRoute>
              <PrdEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/:productSlug/customer-profiles"
          element={
            <ProtectedRoute>
              <CustomerProfiles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/:productSlug/flows"
          element={
            <ProtectedRoute>
              <UserFlows />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/:productSlug/development"
          element={
            <ProtectedRoute>
              <KanbanBoard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/:productSlug/prompts"
          element={
            <ProtectedRoute>
              <PromptLibrary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/:productSlug/notes"
          element={
            <ProtectedRoute>
              <NotesPanel />
            </ProtectedRoute>
          }
        />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/reset-password" element={<AuthCallback />} />
        <Route path="/payment/return" element={<PaymentReturn />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />
        <Route path="/payment" element={<PaymentWall />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <AuthProvider>
            <ProductProvider>
              <Elements stripe={stripePromise}>
                <AppRoutes />
              </Elements>
            </ProductProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;