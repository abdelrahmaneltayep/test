import React from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import './styles/tokens.css';
import './styles/globals.css';

document.documentElement.dir = 'rtl';
document.documentElement.lang = 'ar';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><MemoryRouter initialEntries={['/']}><App /></MemoryRouter></React.StrictMode>,
);
