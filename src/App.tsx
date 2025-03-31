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
import { ThemeProvider } from '@/components/theme-provider';

// Pages
import Index from './pages/Index';
import TransactionsPage from './pages/transactions';
import NotFound from './pages/NotFound';
import BudgetApiPage from './pages/budgets/index-api';

import PaymentMethodsPage from './pages/payment-methods';


// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="zenith-theme">
        <ToastProvider>
          <TooltipProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/budgets-api" element={<BudgetApiPage />} />
                <Route path="*" element={<NotFound />} />
                <Route path="/payment-methods" element={<PaymentMethodsPage />} />

              </Routes>
            </Router>
            <Toaster />
          </TooltipProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
