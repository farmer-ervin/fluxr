import React from 'react';
import { Check, Loader2, XCircle } from 'lucide-react';

export type SaveStatus = 'saved' | 'saving' | 'error';

interface SaveIndicatorProps {
  status: SaveStatus;
  error?: string | null;
}

export function SaveIndicator({ status, error }: SaveIndicatorProps) {
  if (status === 'saved') {
    return (
      <div className="save-indicator save-indicator-saved">
        <Check className="w-4 h-4" />
        <span>All changes saved</span>
      </div>
    );
  }

  if (status === 'saving') {
    return (
      <div className="save-indicator save-indicator-saving">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Saving changes...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="save-indicator save-indicator-error" title={error || undefined}>
        <XCircle className="w-4 h-4" />
        <span>Error saving changes</span>
      </div>
    );
  }

  return null;
}