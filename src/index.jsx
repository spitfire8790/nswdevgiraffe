import React from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App';
import './styles.css';

// Find the root element
const container = document.getElementById('root');

// Create a root
const root = createRoot(container);

// Render the app
root.render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
); 