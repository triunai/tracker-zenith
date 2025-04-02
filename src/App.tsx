import React, { useEffect } from 'react';
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
import { DashboardProvider } from '@/context/DashboardContext';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { initTokenCleaner } from '@/lib/utils/tokenCleaner';

// Pages
import Index from './pages/Index';
import TransactionsPage from './pages/transactions';
import NotFound from './pages/NotFound';
import BudgetPage from './pages/budgets/index';
import PaymentMethodsPage from './pages/payment-methods';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Profile from './pages/Profile';

// Create a client
const queryClient = new QueryClient();

// Helper function for consistent timestamp logging
const logWithTimestamp = (message: string, data?: any) => {
  console.log(`[${new Date().toISOString()}] ${message}`, data ? data : '');
};

function App() {
  // Initialize token cleaner on app startup with query param check for forced clean
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const forceClean = urlParams.get('force_clean') === 'true';
    
    if (forceClean) {
      logWithTimestamp('[App] Force clean requested via URL parameter');
    }
    
    // Check if there was a previously detected hanging auth call
    const hangDetected = sessionStorage.getItem('auth_hang_detected');
    if (hangDetected) {
      logWithTimestamp('[App] Previous authentication hang detected, clearing tokens');
      sessionStorage.removeItem('auth_hang_detected');
      initTokenCleaner(true);
    } else {
      initTokenCleaner(forceClean);
    }
    
    // Set up a global handler to detect potential auth hangs
    let authOperationStarted = false;
    let authOperationTimeout: NodeJS.Timeout;
    
    // Create a MutationObserver to watch for loading UI
    const observer = new MutationObserver((mutations) => {
      // Check if the loading UI for auth is visible
      const isAuthLoading = document.querySelector('.auth-loading-indicator');
      
      if (isAuthLoading && !authOperationStarted) {
        authOperationStarted = true;
        // If loading indicator is visible for too long, mark as potential hang
        authOperationTimeout = setTimeout(() => {
          logWithTimestamp('[App] Auth operation taking too long, marking potential hang');
          sessionStorage.setItem('auth_hang_detected', 'true');
        }, 15000); // 15 seconds is very generous for auth operations
      } else if (!isAuthLoading && authOperationStarted) {
        // Loading finished, clear the timeout
        authOperationStarted = false;
        if (authOperationTimeout) {
          clearTimeout(authOperationTimeout);
        }
      }
    });
    
    // Start observing changes to the document body
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['class'] 
    });
    
    return () => {
      observer.disconnect();
      if (authOperationTimeout) {
        clearTimeout(authOperationTimeout);
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="zenith-theme">
        <ToastProvider>
          <TooltipProvider>
            <AuthProvider>
              <DashboardProvider>
                <Router>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    
                    {/* Protected Routes */}
                    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                    <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
                    <Route path="/budgets" element={<ProtectedRoute><BudgetPage /></ProtectedRoute>} />
                    <Route path="/payment-methods" element={<ProtectedRoute><PaymentMethodsPage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    
                    {/* 404 Route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Router>
                <Toaster />
              </DashboardProvider>
            </AuthProvider>
          </TooltipProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
