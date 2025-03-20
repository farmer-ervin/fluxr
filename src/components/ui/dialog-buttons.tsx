import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Check, Loader2 } from "lucide-react";

interface DialogButtonsProps {
  cancelText?: string;
  confirmText?: string;
  cancelIcon?: React.ReactNode;
  confirmIcon?: React.ReactNode;
  onCancel?: () => void;
  onConfirm?: () => void;
  isLoading?: boolean;
  isDestructive?: boolean;
  className?: string;
  disabled?: boolean;
}

export function DialogButtons({
  cancelText = "Cancel",
  confirmText = "Confirm",
  cancelIcon = <X className="icon-button" />,
  confirmIcon = <Check className="icon-button" />,
  onCancel,
  onConfirm,
  isLoading = false,
  isDestructive = false,
  className,
  disabled = false,
}: DialogButtonsProps) {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>
      <Button 
        variant="outline" 
        onClick={onCancel}
        disabled={isLoading || disabled}
        type="button"
      >
        {cancelIcon}
        {cancelText}
      </Button>
      <Button 
        variant={isDestructive ? "destructive" : "default"}
        onClick={onConfirm}
        disabled={isLoading || disabled}
        type={onConfirm ? "button" : "submit"}
      >
        {isLoading ? (
          <>
            <Loader2 className="icon-button animate-spin" />
            Loading...
          </>
        ) : (
          <>
            {confirmIcon}
            {confirmText}
          </>
        )}
      </Button>
    </div>
  );
} 