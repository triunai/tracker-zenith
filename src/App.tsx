import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  Toaster, 
  ToastProvider,
  TooltipProvider
} from '@/components/UI';
import { ThemeProvider } from '@/components/theme-provider';
import { DashboardProvider } from '@/context/DashboardContext';
import { AuthProvider, initTokenManager } from '@/lib/auth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

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
    const resetAuth = urlParams.get('reset_auth') === 'true';
    
    if (forceClean) {
      logWithTimestamp('[App] Force clean requested via URL parameter');
    }
    
    if (resetAuth) {
      logWithTimestamp('[App] Auth reset requested via URL parameter');
      // Clear any auth-related storage
      sessionStorage.removeItem('auth_hang_detected');
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
    }
    
    // Check if there was a previously detected hanging auth call
    const hangDetected = sessionStorage.getItem('auth_hang_detected');
    
    // Only force clean if explicitly requested or if a hang was detected
    // This prevents automatic token clearing on normal page reloads
    if (hangDetected) {
      logWithTimestamp('[App] Previous authentication hang detected, clearing tokens');
      sessionStorage.removeItem('auth_hang_detected');
      initTokenManager({ forceClean: true }); // Force clean tokens
    } else if (forceClean) {
      // Only force clean if explicitly requested in URL
      initTokenManager({ forceClean: true });
    } else {
      // For normal page loads, don't force clean
      initTokenManager({ forceClean: false });
    }
    
    // Set up a global handler to detect potential auth hangs
    let authOperationStarted = false;
    let authOperationTimeout: NodeJS.Timeout;
    
    // Create a MutationObserver to watch for loading UI
    const observer = new MutationObserver((mutations) => {
      // Check if the loading UI for auth is visible (look for multiple possible indicators)
      const isAuthLoading = 
        document.querySelector('.auth-loading-indicator') || 
        document.querySelector('.auth-spinner') || 
        document.querySelector('[data-auth-loading="true"]');
      
      if (isAuthLoading && !authOperationStarted) {
        authOperationStarted = true;
        logWithTimestamp('[App] Auth operation detected, starting timer');
        // If loading indicator is visible for too long, mark as potential hang
        authOperationTimeout = setTimeout(() => {
          logWithTimestamp('[App] Auth operation taking too long, marking potential hang');
          sessionStorage.setItem('auth_hang_detected', 'true');
          // Offer a reset option to the user
          if (confirm('Authentication is taking longer than expected. Would you like to reset and try again?')) {
            window.location.href = window.location.pathname + '?reset_auth=true';
          }
        }, 15000); // 15 seconds is very generous for auth operations
      } else if (!isAuthLoading && authOperationStarted) {
        // Loading finished, clear the timeout
        logWithTimestamp('[App] Auth operation completed successfully');
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
      attributeFilter: ['class', 'data-auth-loading'] 
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
