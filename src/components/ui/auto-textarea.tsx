import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AutoTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function AutoTextarea({ className, value, onChange, ...props }: AutoTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set the height to match the content
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // Adjust height on value change
  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange(e);
        adjustHeight();
      }}
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-card dark:border-input hover:border-input focus:border-input resize-none overflow-hidden transition-height duration-200",
        className
      )}
      {...props}
    />
  );
}