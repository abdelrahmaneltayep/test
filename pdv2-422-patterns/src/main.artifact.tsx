/**
 * Entry point for the single-file artifact build.
 * Differs from main.tsx only in the router: MemoryRouter keeps navigation
 * entirely in memory, so the page never touches location — which is what an
 * embedded/sandboxed preview frame needs.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import './styles/tokens.css';
import './styles/globals.css';

document.documentElement.dir = 'rtl';
document.documentElement.lang = 'ar';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MemoryRouter initialEntries={['/pattern-1']}>
      <App />
    </MemoryRouter>
  </React.StrictMode>,
);
