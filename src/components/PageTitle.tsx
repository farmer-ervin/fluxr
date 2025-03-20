import React from 'react';
import { Helmet } from 'react-helmet-async';

interface PageTitleProps {
  title: string;
  suffix?: boolean;
  className?: string;
  visuallyHidden?: boolean;
}

const appName = 'Fluxr';

export function PageTitle({ 
  title, 
  suffix = true, 
  className = "",
  visuallyHidden = false
}: PageTitleProps) {
  const fullTitle = suffix ? `${title} | ${appName}` : title;

  return (
    <>
      <Helmet>
        <title>{fullTitle}</title>
      </Helmet>
      
      {!visuallyHidden && (
        <h1 className={`text-3xl font-bold mb-8 ${className}`}>
          {title}
        </h1>
      )}
    </>
  );
}