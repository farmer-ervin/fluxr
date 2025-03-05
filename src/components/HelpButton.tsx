import React, { useState } from 'react';
import { Bug, Lightbulb, HelpCircle, X, LifeBuoy } from 'lucide-react';
import { Button } from './ui/button';

export function HelpButton() {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleEmailClick = (type: 'bug' | 'feature' | 'support') => {
    const subject = encodeURIComponent(
      type === 'bug' 
        ? 'Report Bug'
        : type === 'feature'
        ? 'Suggest Feature'
        : 'Get Support'
    );
    window.location.href = `mailto:steve@fluxr.ai?subject=${subject}`;
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2">
      {isExpanded && (
        <div className="flex flex-col gap-2 mb-2">
          <Button
            variant="secondary"
            size="sm"
            className="shadow-lg"
            onClick={() => handleEmailClick('bug')}
          >
            <Bug className="w-4 h-4 mr-2" />
            Report Bug
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="shadow-lg"
            onClick={() => handleEmailClick('feature')}
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Suggest Feature
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="shadow-lg"
            onClick={() => handleEmailClick('support')}
          >
            <LifeBuoy className="w-4 h-4 mr-2" />
            Get Support
          </Button>
        </div>
      )}
      <Button
        variant="secondary"
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <X className="h-6 w-6" />
        ) : (
          <HelpCircle className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}