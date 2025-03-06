import React from 'react';

export function EnvironmentBanner() {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost') {
    return (
      <div className="sticky top-0 z-50 bg-red-500 text-white text-xs py-1 text-center">
        Localhost
      </div>
    );
  }
  
  if (hostname === 'beta.fluxr.ai') {
    return (
      <div className="sticky top-0 z-50 bg-blue-500 text-white text-xs py-1 text-center">
        Beta
      </div>
    );
  }
  
  return null;
} 