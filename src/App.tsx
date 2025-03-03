import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/UI/toaster';
import { ToastProvider } from '@/components/UI/use-toast';
import { TooltipProvider } from '@/components/UI/tooltip';

// Pages
import Index from './pages/Index';
import Transactions from './pages/Transactions';
import NotFound from './pages/NotFound';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <TooltipProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </TooltipProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
