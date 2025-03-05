import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomePopup({ isOpen, onClose }: WelcomePopupProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to Fluxr</DialogTitle>
          <DialogDescription>
            Let's bring your MVP to life
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600">
            Thanks for joining! I'm Steve, the founder of Fluxr. I built this tool to help you define, design, and track your MVP development with AI assistance.
          </p>
          <p className="text-sm text-gray-600">
            Please reach out if you have any feedback or run into issues: steve@fluxr.ai
          </p>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="secondary">
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}