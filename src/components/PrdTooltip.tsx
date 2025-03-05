import React, { useState, useEffect } from 'react';

export function PrdTooltip() {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // Check if this tooltip has been shown before
    const hasSeenTooltip = localStorage.getItem('prd_tooltip_shown');
    
    if (!hasSeenTooltip) {
      // Show tooltip after a small delay
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  const handleDismiss = () => {
    setVisible(false);
    // Mark tooltip as shown in localStorage
    localStorage.setItem('prd_tooltip_shown', 'true');
  };
  
  if (!visible) return null;
  
  return (
    <div className="absolute -bottom-16 right-0 animate-in fade-in zoom-in duration-300">
      <div className="relative">
        {/* Arrow pointing up to the button */}
        <div className="absolute -top-2 right-14 w-4 h-4 bg-brand-purple rotate-45"></div>
        
        {/* Tooltip content */}
        <div className="bg-brand-purple text-white px-6 py-3 rounded-lg shadow-lg relative z-10">
          <p className="font-medium text-center whitespace-nowrap">Start here!</p>
        </div>
        
        {/* Close button */}
        <button 
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-100 z-20"
        >
          <span className="text-xs text-gray-600">&times;</span>
        </button>
      </div>
    </div>
  );
}