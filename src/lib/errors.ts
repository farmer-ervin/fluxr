import { supabase } from './supabase';

export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

export interface ErrorLogData {
  error_type: string;
  error_code?: string;
  error_message: string;
  stack_trace?: string;
  severity: ErrorSeverity;
  metadata?: Record<string, any>;
  request_payload?: Record<string, any>;
}

export class PaymentError extends Error {
  constructor(
    message: string,
    public code?: string,
    public severity: ErrorSeverity = 'error',
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export async function logError(data: ErrorLogData) {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Get browser info
    const browserInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      vendor: navigator.vendor
    };

    // Log error
    await supabase.from('error_logs').insert({
      user_id: user?.id,
      error_type: data.error_type,
      error_code: data.error_code,
      error_message: data.error_message,
      stack_trace: data.stack_trace,
      severity: data.severity,
      metadata: data.metadata,
      request_payload: data.request_payload,
      browser_info: browserInfo
    });
  } catch (err) {
    // Fail silently but log to console
    console.error('Failed to log error:', err);
  }
}

// Payment error types
export const PAYMENT_ERRORS = {
  CARD_DECLINED: 'card_declined',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  INVALID_DETAILS: 'invalid_details',
  PROCESSING_ERROR: 'processing_error',
  NETWORK_ERROR: 'network_error',
  SESSION_EXPIRED: 'session_expired',
  VERIFICATION_FAILED: 'verification_failed',
  CORS_ERROR: 'cors_error',
  DATABASE_ERROR: 'database_error'
} as const;

// User-friendly error messages
export const ERROR_MESSAGES = {
  [PAYMENT_ERRORS.CARD_DECLINED]: 'Your card was declined. Please try a different card.',
  [PAYMENT_ERRORS.INSUFFICIENT_FUNDS]: 'Insufficient funds. Please try a different card.',
  [PAYMENT_ERRORS.INVALID_DETAILS]: 'Invalid card details. Please check and try again.',
  [PAYMENT_ERRORS.PROCESSING_ERROR]: 'Payment processing error. Please try again.',
  [PAYMENT_ERRORS.NETWORK_ERROR]: 'Network error. Please check your connection and try again.',
  [PAYMENT_ERRORS.SESSION_EXPIRED]: 'Payment session expired. Please try again.',
  [PAYMENT_ERRORS.VERIFICATION_FAILED]: 'Payment verification failed. Please contact support.',
  [PAYMENT_ERRORS.CORS_ERROR]: 'Connection error. Please try again.',
  [PAYMENT_ERRORS.DATABASE_ERROR]: 'System error. Please try again later.'
} as const;

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 5000,
  backoffFactor: 2
};

// Timeout configuration
export const TIMEOUT_CONFIG = {
  paymentProcessing: 30000, // 30 seconds
  verificationTimeout: 10000 // 10 seconds
};