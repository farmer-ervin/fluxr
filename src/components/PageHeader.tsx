import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6 mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-1">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
} 