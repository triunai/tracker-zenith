import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Loader2, RefreshCcw, Trash2, Database } from 'lucide-react';
import { sessionApi } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/supabase.ts';

// Helper function for consistent timestamp logging
const logWithTimestamp = (message: string, data?: any) => {
  console.log(`[${new Date().toISOString()}] ${message}`, data ? data : '');
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

// Debug function to test stored procedures
const testStoredProcedures = async (userId: string) => {
  try {
    // Log test attempt
    console.log('🧪 [DEBUG] Testing stored procedures for user:', userId);
    
    // Get current date for testing
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    console.log(`🧪 [DEBUG] Test date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Test 1: get_total_income
    console.log('🧪 [DEBUG] Testing get_total_income...');
    const incomeResult = await supabase.rpc('get_total_income', {
      p_user_id: userId,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString()
    });
    console.log('🧪 [DEBUG] get_total_income result:', incomeResult);
    
    // Test 2: get_total_expenses
    console.log('🧪 [DEBUG] Testing get_total_expenses...');
    const expensesResult = await supabase.rpc('get_total_expenses', {
      p_user_id: userId,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString()
    });
    console.log('🧪 [DEBUG] get_total_expenses result:', expensesResult);
    
    // Test 3: get_user_balance
    console.log('🧪 [DEBUG] Testing get_user_balance...');
    const balanceResult = await supabase.rpc('get_user_balance', {
      p_user_id: userId,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString()
    });
    console.log('🧪 [DEBUG] get_user_balance result:', balanceResult);
    
    // Test 4: get_spending_by_date
    console.log('🧪 [DEBUG] Testing get_spending_by_date...');
    const spendingByDateResult = await supabase.rpc('get_spending_by_date', {
      p_user_id: userId,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString()
    });
    console.log('🧪 [DEBUG] get_spending_by_date result:', spendingByDateResult);
    
    // Test 5: get_spending_by_category
    console.log('🧪 [DEBUG] Testing get_spending_by_category...');
    const categoryResult = await supabase.rpc('get_spending_by_category', {
      p_user_id: userId,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString()
    });
    console.log('🧪 [DEBUG] get_spending_by_category result:', categoryResult);
    
    console.log('🧪 [DEBUG] All procedure tests completed');
    return true;
  } catch (error) {
    console.error('🧪 [DEBUG] Error testing procedures:', error);
    return false;
  }
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login'
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [authTimeout, setAuthTimeout] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isForceLoggingOut, setIsForceLoggingOut] = useState(false);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const location = useLocation();

  // Log navigation and authentication state
  useEffect(() => {
    logWithTimestamp(`[ProtectedRoute] Current path: ${location.pathname}, isLoading: ${isLoading}, isAuthenticated: ${isAuthenticated}`);
  }, [location.pathname, isLoading, isAuthenticated]);

  // Set up a timeout for authentication check
  useEffect(() => {
    if (isLoading) {
      logWithTimestamp(`[ProtectedRoute] Authentication loading started, setting timeout`);
      const timeoutId = setTimeout(() => {
        logWithTimestamp(`[ProtectedRoute] Authentication timeout triggered after 5 seconds`);
        setAuthTimeout(true);
      }, 5000); // Wait 5 seconds before showing retry option

      return () => clearTimeout(timeoutId);
    } else {
      logWithTimestamp(`[ProtectedRoute] Authentication loading finished, clearing timeout`);
      setAuthTimeout(false);
    }
  }, [isLoading]);

  // Function to retry authentication
  const handleRetryAuth = async () => {
    logWithTimestamp(`[ProtectedRoute] Retry authentication clicked`);
    setIsRetrying(true);
    try {
      // Try to refresh the session
      logWithTimestamp(`[ProtectedRoute] Attempting to refresh session`);
      await sessionApi.refreshSession();
      // Reload the page to retry the auth flow
      logWithTimestamp(`[ProtectedRoute] Session refresh attempt completed, reloading page`);
      window.location.reload();
    } catch (error) {
      logWithTimestamp(`[ProtectedRoute] Failed to retry authentication:`, error);
      console.error('Failed to retry authentication:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  // Function to force logout and clear all local storage
  const handleForceLogout = () => {
    logWithTimestamp(`[ProtectedRoute] Force logout clicked, clearing all localStorage`);
    setIsForceLoggingOut(true);
    
    try {
      // Nuclear option - clear everything in localStorage
      localStorage.clear();
      logWithTimestamp(`[ProtectedRoute] All localStorage data cleared, redirecting to ${redirectTo}`);
      
      // Add a small delay to ensure UI feedback before redirect
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 500);
    } catch (error) {
      logWithTimestamp(`[ProtectedRoute] Error during force logout:`, error);
      console.error('Error during force logout:', error);
      setIsForceLoggingOut(false);
    }
  };
  
  // Function to test database procedures
  const handleTestDb = async () => {
    if (!user || !user.id) {
      console.error('Cannot test DB: User ID not available');
      return;
    }
    
    setIsTestingDb(true);
    try {
      await testStoredProcedures(user.id);
    } finally {
      setIsTestingDb(false);
    }
  };

  // Show a loading spinner while checking authentication
  if (isLoading) {
    logWithTimestamp(`[ProtectedRoute] Rendering loading state, timeout: ${authTimeout}`);
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-center text-muted-foreground mb-2">
          {authTimeout ? "Taking longer than expected..." : "Verifying your session..."}
        </p>
        
        {authTimeout && (
          <div className="flex flex-col items-center mt-4">
            <p className="text-center text-sm text-muted-foreground mb-4">
              Authentication is taking longer than expected. This may be due to a stale session.
            </p>
            <Button 
              onClick={handleRetryAuth} 
              disabled={isRetrying || isForceLoggingOut || isTestingDb} 
              variant="outline"
              className="flex items-center"
            >
              {isRetrying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Retry Authentication
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleForceLogout}
              disabled={isRetrying || isForceLoggingOut || isTestingDb}
              variant="destructive"
              className="flex items-center mt-2"
            >
              {isForceLoggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Clearing Data...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Force Logout (Clear All Data)
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleTestDb}
              disabled={isRetrying || isForceLoggingOut || isTestingDb || !user}
              variant="outline"
              className="flex items-center mt-2"
            >
              {isTestingDb ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing Database...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Test Database Connection
                </>
              )}
            </Button>
            
            <Button 
              onClick={() => {
                logWithTimestamp(`[ProtectedRoute] Go to Login clicked, navigating to ${redirectTo}`);
                window.location.href = redirectTo;
              }} 
              variant="link"
              className="mt-2"
              disabled={isForceLoggingOut || isTestingDb}
            >
              Go to Login
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    logWithTimestamp(`[ProtectedRoute] Not authenticated, redirecting from ${location.pathname} to ${redirectTo}`);
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  // Render children if authenticated
  logWithTimestamp(`[ProtectedRoute] Authentication successful, rendering protected content at ${location.pathname}`);
  return <>{children}</>;
}; 