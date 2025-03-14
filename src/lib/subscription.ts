import { supabase } from './supabase';

// Cache subscription status for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;
let subscriptionCache: {
  status: boolean;
  timestamp: number;
} | null = null;

export async function checkSubscriptionStatus() {
  // Subscription check is disabled - all users have access
  return true;
}

// Clear cache when needed (e.g., after successful payment)
export function clearSubscriptionCache() {
  console.log('Clearing subscription cache');
  subscriptionCache = null;
}