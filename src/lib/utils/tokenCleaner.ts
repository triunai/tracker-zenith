import { supabase } from '../supabase/supabase';

// Constants to align with authApi.ts
const TIMEOUT_DEFAULT = 8000; // 8 seconds - match authApi.ts
const TIMEOUT_EXTENDED = 12000; // 12 seconds - match authApi.ts
const TIMEOUT_QUICK = 3000; // 3 seconds - match authApi.ts

// Helper function for consistent timestamp logging
const logWithTimestamp = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
};

// Track auth calls to detect hanging operations
let authCallsInProgress = false;
let authCallStartTime = 0;
const AUTH_CALL_TIMEOUT = 9000; // 9 seconds (slightly higher than default timeout)

/**
 * Function to check if a token is valid by attempting to get user info
 * @returns true if valid, false if invalid
 */
const isTokenValid = async (): Promise<boolean> => {
  logWithTimestamp('[TokenCleaner:isTokenValid] Validating token...');
  
  // Set flag that auth call is in progress
  authCallsInProgress = true;
  authCallStartTime = Date.now();
  
  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Token validation timed out after ${TIMEOUT_DEFAULT}ms`));
      }, TIMEOUT_DEFAULT);
    });
    
    logWithTimestamp('[TokenCleaner:isTokenValid] Calling supabase.auth.getUser()');
    // Race the Supabase call against the timeout
    const result = await Promise.race([
      supabase.auth.getUser().then(({ data, error }) => {
        // Detailed logging of response
        if (error) {
          logWithTimestamp('[TokenCleaner:isTokenValid] Token validation failed with error:', error.message);
          return false;
        }
        
        if (!data.user) {
          logWithTimestamp('[TokenCleaner:isTokenValid] Token validation failed: No user found');
          return false;
        }
        
        // Log token details without exposing sensitive info
        logWithTimestamp('[TokenCleaner:isTokenValid] Token appears valid, user:', { 
          id: data.user.id,
          email: data.user.email,
          last_sign_in: data.user.last_sign_in_at
        });
        
        return true;
      }),
      timeoutPromise
    ]);
    
    // Reset flag
    authCallsInProgress = false;
    
    return result;
  } catch (error) {
    logWithTimestamp('[TokenCleaner:isTokenValid] Error validating token:', error);
    // Reset flag
    authCallsInProgress = false;
    return false;
  }
};

/**
 * Clear all Supabase auth tokens from localStorage to reset the auth state
 */
export const clearAuthTokens = (): void => {
  logWithTimestamp('[TokenCleaner:clearAuthTokens] Clearing all Supabase auth tokens');
  
  try {
    // Find all keys in localStorage that look like Supabase auth tokens
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('-auth-token') || key.includes('supabase.auth'))) {
        keysToRemove.push(key);
      }
    }
    
    // Log all keys found
    logWithTimestamp(`[TokenCleaner:clearAuthTokens] Found ${keysToRemove.length} token entries:`, keysToRemove);
    
    // Remove all identified keys
    keysToRemove.forEach(key => {
      logWithTimestamp(`[TokenCleaner:clearAuthTokens] Removing token: ${key}`);
      localStorage.removeItem(key);
    });
    
    logWithTimestamp(`[TokenCleaner:clearAuthTokens] Cleared ${keysToRemove.length} token entries`);
  } catch (error) {
    logWithTimestamp('[TokenCleaner:clearAuthTokens] Error clearing tokens:', error);
  }
};

/**
 * Force clears all data in localStorage - use only in emergency situations
 */
export const forceCleanAllData = (): void => {
  logWithTimestamp('[TokenCleaner:forceCleanAllData] EMERGENCY CLEAN: Clearing all localStorage data');
  
  try {
    // Backup current key count for logging
    const keyCount = localStorage.length;
    
    // Clear everything
    localStorage.clear();
    
    logWithTimestamp(`[TokenCleaner:forceCleanAllData] Successfully cleared all ${keyCount} localStorage items`);
  } catch (error) {
    logWithTimestamp('[TokenCleaner:forceCleanAllData] Error clearing localStorage:', error);
  }
};

/**
 * Checks token validity and clears invalid tokens
 * @returns true if tokens were cleared, false otherwise
 */
export const checkAndClearInvalidTokens = async (): Promise<boolean> => {
  logWithTimestamp('[TokenCleaner:checkAndClearInvalidTokens] Checking token validity');
  
  const isValid = await isTokenValid();
  logWithTimestamp('[TokenCleaner:checkAndClearInvalidTokens] Token validation result:', isValid);
  
  if (!isValid) {
    logWithTimestamp('[TokenCleaner:checkAndClearInvalidTokens] Invalid token detected, clearing all auth tokens');
    clearAuthTokens();
    return true;
  }
  
  logWithTimestamp('[TokenCleaner:checkAndClearInvalidTokens] Token is valid');
  return false;
};

/**
 * Detects if any auth calls are taking too long
 */
const detectHangingAuthCalls = (): boolean => {
  if (authCallsInProgress && (Date.now() - authCallStartTime > AUTH_CALL_TIMEOUT)) {
    logWithTimestamp(`[TokenCleaner:detectHangingAuthCalls] Auth call has been running for ${Date.now() - authCallStartTime}ms, which exceeds timeout of ${AUTH_CALL_TIMEOUT}ms`);
    return true;
  }
  return false;
};

/**
 * Initialize the token cleaner to run when the app starts
 * @param forceClean If true, will force clean all localStorage data on init
 * This should be called in the app's entry point
 */
export const initTokenCleaner = async (forceClean = false): Promise<void> => {
  logWithTimestamp('[TokenCleaner:initTokenCleaner] Initializing token cleaner');
  
  // Dump the current localStorage state (keys only) for debugging
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }
    logWithTimestamp('[TokenCleaner:initTokenCleaner] Current localStorage keys:', keys);
    
    // Handle auto cleaning for hung auth sessions
    const supabaseKeysCount = keys.filter(key => key && 
      (key.includes('-auth-token') || key.includes('supabase.auth'))
    ).length;
    
    // If force clean is requested or there's evidence of a previously hung session
    if (forceClean) {
      logWithTimestamp('[TokenCleaner:initTokenCleaner] Force clean requested, clearing all auth tokens');
      clearAuthTokens();
      // Refresh to create a clean slate
      window.location.reload();
      return;
    }
    
    // Only clear tokens if there are existing Supabase tokens
    if (supabaseKeysCount > 0) {
      // Run token validation, but with a safety timeout to prevent hangs
      const tokenCheckPromise = new Promise<void>(async (resolve) => {
        // If we detect hanging after this timeout, we'll take action
        setTimeout(() => {
          if (detectHangingAuthCalls()) {
            logWithTimestamp('[TokenCleaner:initTokenCleaner] Detected hanging auth call, forcing token cleanup');
            clearAuthTokens();
            window.location.reload();
          }
          resolve();
        }, AUTH_CALL_TIMEOUT + 1000); // Give a little extra time past the auth call timeout
        
        // Check tokens
        const cleared = await checkAndClearInvalidTokens();
        if (cleared) {
          logWithTimestamp('[TokenCleaner:initTokenCleaner] Tokens were cleared, refreshing page');
          window.location.reload();
        }
        resolve();
      });
      
      // Wait for token check with a safety timeout
      await tokenCheckPromise;
    }
  } catch (e) {
    logWithTimestamp('[TokenCleaner:initTokenCleaner] Error during initialization:', e);
  }
  
  // Set up periodic checks for long-running sessions
  setInterval(async () => {
    logWithTimestamp('[TokenCleaner:scheduled] Running scheduled token check');
    await checkAndClearInvalidTokens();
  }, 30 * 60 * 1000); // Check every 30 minutes
  
  // Also set up periodic check for hanging auth calls
  setInterval(() => {
    if (detectHangingAuthCalls()) {
      logWithTimestamp('[TokenCleaner:scheduled] Detected hanging auth call during scheduled check, forcing token cleanup');
      clearAuthTokens();
      // Reload the page to recover
      window.location.reload();
    }
  }, 10000); // Check every 10 seconds
}; 