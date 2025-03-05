import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthModal } from '@/components/auth/AuthModal';
import { Button } from '@/components/ui/button';

export function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleGetStarted = () => {
    if (user) {
      navigate('/products');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <div className="card max-w-2xl w-full">
        <FileText className="w-16 h-16 text-brand-purple mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Fluxr
        </h2>
        <p className="text-gray-600 mb-8">
          Create professional product requirement documents with ease. Get started by clicking the button below.
        </p>
        <Button
          onClick={handleGetStarted}
          className="btn-primary"
        >
          {user ? 'View Your Products' : 'Get Started'}
        </Button>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}