import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DialogButtons } from "@/components/ui/dialog-buttons";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DialogTemplateProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

// Example of a standard form dialog
export function FormDialogTemplate({ isOpen, onOpenChange, trigger }: DialogTemplateProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Handle form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button>Open Dialog</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            This is a description of what this dialog does.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter name"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <DialogButtons
              confirmText="Save Changes"
              isLoading={isLoading}
              onCancel={onOpenChange && (() => onOpenChange(false))}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Example of a confirmation dialog
export function ConfirmationDialogTemplate({ isOpen, onOpenChange, trigger }: DialogTemplateProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      // Handle confirmation
      await new Promise(resolve => setTimeout(resolve, 1000));
      onOpenChange?.(false);
    } catch (err) {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Open Confirmation</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please confirm you want to proceed.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogButtons
            confirmText="Confirm"
            isLoading={isLoading}
            onCancel={onOpenChange && (() => onOpenChange(false))}
            onConfirm={handleConfirm}
            isDestructive
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Example of a loading dialog
export function LoadingDialogTemplate({ isOpen, onOpenChange }: DialogTemplateProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="flex flex-col items-center justify-center space-y-4 py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <DialogTitle>Processing</DialogTitle>
          <DialogDescription>
            Please wait while we process your request...
          </DialogDescription>
        </div>
      </DialogContent>
    </Dialog>
  );
} 