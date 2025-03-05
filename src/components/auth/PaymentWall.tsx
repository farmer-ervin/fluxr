import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Check } from 'lucide-react';
import { supabase, handleSupabaseError } from '@/lib/supabase';
import { useStripe, useElements, EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { clearSubscriptionCache } from '@/lib/subscription';
import { useAuth } from './AuthProvider';
import { stripePromise } from '@/lib/stripe';

export function PaymentWall() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<'initial' | 'loading' | 'ready' | 'error'>('initial');

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      navigate('/');
    } catch (error) {
      setError(handleSupabaseError(error).message);
    } finally {
      setIsSigningOut(false);
    }
  };

  useEffect(() => {
    // Create a checkout session when the component mounts
    const createCheckoutSession = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setCheckoutStatus('loading');

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) {
          navigate('/');
          return;
        }

        // Create checkout session with embedded mode
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ mode: 'embedded' }) // Specify embedded mode
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create checkout session');
        }

        const data = await response.json();
        
        // We now have a client_secret instead of a redirect URL
        if (data.clientSecret) {
          // Clear subscription cache before starting checkout
          clearSubscriptionCache();
          setClientSecret(data.clientSecret);
          setCheckoutStatus('ready');
        } else {
          throw new Error('Invalid checkout session response');
        }
      } catch (err) {
        console.error('Payment error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initiate payment. Please try again.');
        setCheckoutStatus('error');
      } finally {
        setIsLoading(false);
      }
    };

    createCheckoutSession();
  }, [navigate]);

  // Handle the return from checkout
  const handleCheckoutComplete = (event: any) => {
    if (event.status === 'complete') {
      navigate('/payment/return?session_id=' + event.sessionId);
    } else if (event.error) {
      console.error('Checkout error:', event.error);
      setError(`Payment error: ${event.error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Complete Your Purchase
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="text-gray-500 hover:text-gray-700"
          >
            {isSigningOut ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing Out...
              </span>
            ) : (
              'Sign Out'
            )}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Show product info while checkout is loading */}
        {(checkoutStatus === 'initial' || checkoutStatus === 'loading') && (
          <div className="space-y-4 mb-6">
            <p className="text-gray-600">
              Get lifetime access to all features for a one-time payment of $15.
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Unlimited products and PRDs
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                AI-powered content generation
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                All future updates included
              </li>
            </ul>
            
            <div className="flex justify-center mt-4">
              <Loader2 className="w-6 h-6 animate-spin text-brand-purple" />
            </div>
          </div>
        )}

        {/* Embedded Checkout */}
        {clientSecret && checkoutStatus === 'ready' && (
          <div className="mb-4 rounded-lg overflow-hidden border border-gray-200">
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ clientSecret }}
            >
              <EmbeddedCheckout onComplete={handleCheckoutComplete} />
            </EmbeddedCheckoutProvider>
          </div>
        )}

        {/* If checkout failed to load, show a retry button */}
        {checkoutStatus === 'error' && !clientSecret && (
          <Button
            onClick={() => window.location.reload()}
            className="w-full"
            variant="secondary"
          >
            Retry Payment
          </Button>
        )}
      </div>
    </div>
  );
}