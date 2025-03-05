import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertCircle, Check, Loader2, AlertTriangle, WifiOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  rememberMe: boolean;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
}

const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', regex: /.{8,}/ },
  { label: 'Contains a number', regex: /\d/ },
  { label: 'Contains an uppercase letter', regex: /[A-Z]/ },
  { label: 'Contains a lowercase letter', regex: /[a-z]/ },
  { label: 'Contains a special character', regex: /[!@#$%^&*(),.?":{}|<>]/ },
];

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { signIn, signUp, resetPassword, error: contextError } = useAuth();

  // Check for global auth errors from context
  useEffect(() => {
    if (contextError && isOpen) {
      setErrorMessage(contextError);
    }
  }, [contextError, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        rememberMe: false,
      });
      setErrors({});
      setSuccessMessage('');
      setErrorMessage('');
      setShowForgotPassword(false);
      setIsSignUp(false);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (isSignUp) {
      const failedRequirements = PASSWORD_REQUIREMENTS.filter(
        req => !req.regex.test(formData.password)
      );
      if (failedRequirements.length > 0) {
        newErrors.password = 'Password does not meet requirements';
      }
    }

    if (isSignUp) {
      if (!formData.fullName) {
        newErrors.fullName = 'Full name is required';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      if (showForgotPassword) {
        await resetPassword(formData.email);
        setSuccessMessage('Password reset instructions have been sent to your email');
        setTimeout(() => onClose(), 2000);
      } else if (isSignUp) {
        await signUp(formData.email, formData.password, formData.fullName);
        setSuccessMessage('Account created successfully! You can now sign in.');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        await signIn(formData.email, formData.password, formData.rememberMe);
        setSuccessMessage('Sign in successful! Redirecting...');
        setTimeout(() => {
          onClose();
          navigate('/');
        }, 1000);
      }
    } catch (err) {
      const error = err as Error;
      setErrorMessage(error.message);
      console.error('Authentication error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if the error is connection related
  const isConnectionError = errorMessage.includes('unavailable') || 
                          errorMessage.includes('connection') || 
                          errorMessage.includes('offline');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <span>
                {showForgotPassword
              ? 'Reset Password'
              : isSignUp 
              ? 'Join Fluxr'
              : 'Sign in to Fluxr'}
              </span>
              <span className="text-xs bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-full font-medium">
                BETA
              </span>
            </div>
          </DialogTitle>
          <DialogDescription>
            {showForgotPassword
              ? 'Enter your email to receive password reset instructions'
              : isSignUp
              ? 'Create a new account to get started'
              : 'Sign in to your account to continue'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {successMessage && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4" />
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className={`${isConnectionError ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'} p-3 rounded-lg flex items-center gap-2`}>
              {isConnectionError ? (
                <WifiOff className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              {errorMessage}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? 'border-red-500' : ''}
              disabled={isLoading}
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.email}
              </p>
            )}
          </div>

          {!showForgotPassword && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? 'border-red-500' : ''}
                disabled={isLoading}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
              {errors.password && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>
          )}

          {isSignUp && (
            <>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={errors.fullName ? 'border-red-500' : ''}
                  disabled={isLoading}
                  autoComplete="name"
                />
                {errors.fullName && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Password Requirements:</h4>
                <ul className="text-sm space-y-1">
                  {PASSWORD_REQUIREMENTS.map((req, index) => (
                    <li
                      key={index}
                      className={`flex items-center gap-1 ${
                        req.regex.test(formData.password)
                          ? 'text-green-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {req.regex.test(formData.password) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      {req.label}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {!isSignUp && !showForgotPassword && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
                />
                <Label htmlFor="rememberMe" className="ml-2 text-sm">
                  Remember me
                </Label>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-brand-purple hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {showForgotPassword
                  ? 'Sending...'
                  : isSignUp
                  ? 'Creating Account...'
                  : 'Signing In...'}
              </span>
            ) : (
              <span>
                {showForgotPassword
                  ? 'Send Reset Instructions'
                  : isSignUp
                  ? 'Create Account'
                  : 'Sign In'}
              </span>
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                if (showForgotPassword) {
                  setShowForgotPassword(false);
                } else {
                  setIsSignUp(!isSignUp);
                }
                setErrorMessage('');
              }}
              className="text-sm text-brand-purple hover:underline"
            >
              {showForgotPassword
                ? 'Back to sign in'
                : isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}