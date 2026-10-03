// src/index.jsx — Sprint 15

import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import ReactQueryDevtools from './presentation/components/common/ReactQueryDevtools';
import queryClient from './presentation/api/queryClient';
import './presentation/styles/global.css';   // <-- IMPORTACIÓN AGREGADA

const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <Suspense fallback={null}>
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      </Suspense>
    </QueryClientProvider>
  </StrictMode>
);