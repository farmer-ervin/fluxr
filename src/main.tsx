import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/mixpanel'; // Initialize Mixpanel
import { ThemeProvider } from './components/context/ThemeProvider';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="fluxr-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>
);