/**
 * Token Management Utilities
 * 
 * Handles token storage, validation, and cleanup to ensure consistent session management
 */

import { supabase } from '../../supabase/supabase';
import { logWithTimestamp, withTimeout, API_TIMEOUTS, AuthApiError } from './apiUtils';

// Track auth calls to detect hanging operations
let authCallsInProgress = false;
let authCallStartTime = 0;
const AUTH_CALL_TIMEOUT = 12000; // 12 seconds - slightly higher than default timeout

// Track token cleaner initialization
let tokenCleanerInitialized = false;
let sessionCheckLock = false;

// Token identification patterns
const TOKEN_PATTERNS = {
  AUTH_TOKEN: '-auth-token',
  SUPABASE_AUTH: 'supabase.auth',
  REFRESH_TOKEN: 'refresh-token',
  ACCESS_TOKEN: 'access-token'
};

/**
 * Returns all token-related keys in localStorage
 */
export const getTokenKeys = (): string[] => {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && isTokenKey(key)) {
      keys.push(key);
    }
  }
  return keys;
};

/**
 * Determines if a localStorage key is related to authentication tokens
 */
export const isTokenKey = (key: string): boolean => {
  return Object.values(TOKEN_PATTERNS).some(pattern => key.includes(pattern));
};

/**
 * Checks for corrupted token data in localStorage
 * @returns true if corrupted data was found, false otherwise
 */
export const hasCorruptedTokenData = (): boolean => {
  try {
    const tokenKeys = getTokenKeys();
    
    for (const key of tokenKeys) {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          JSON.parse(value);
        } catch (e) {
          logWithTimestamp(`[TokenManager:hasCorruptedTokenData] Corrupted token data detected in key: ${key}`);
          return true;
        }
      }
    }
    return false;
  } catch (e) {
    logWithTimestamp('[TokenManager:hasCorruptedTokenData] Error checking for corrupted data:', e);
    return true; // Assume corrupted if we can't properly check
  }
};

/**
 * Clears all authentication tokens from localStorage
 */
export const clearAuthTokens = (): void => {
  logWithTimestamp('[TokenManager:clearAuthTokens] Clearing all auth tokens');
  
  try {
    // Find all tokens in localStorage
    const keysToRemove = getTokenKeys();
    
    // Log all keys found
    logWithTimestamp(`[TokenManager:clearAuthTokens] Found ${keysToRemove.length} token entries:`, keysToRemove);
    
    // Remove all identified keys
    keysToRemove.forEach(key => {
      logWithTimestamp(`[TokenManager:clearAuthTokens] Removing token: ${key}`);
      localStorage.removeItem(key);
    });
    
    logWithTimestamp(`[TokenManager:clearAuthTokens] Cleared ${keysToRemove.length} token entries`);
    
    // Also clear session storage flags
    sessionStorage.removeItem('auth_hang_detected');
    
  } catch (error) {
    logWithTimestamp('[TokenManager:clearAuthTokens] Error clearing tokens:', error);
  }
};

/**
 * Emergency measure to clear all data in localStorage
 * Use only in extreme cases
 */
export const forceCleanAllData = (): void => {
  logWithTimestamp('[TokenManager:forceCleanAllData] EMERGENCY CLEAN: Clearing all localStorage data');
  
  try {
    // Backup current key count for logging
    const keyCount = localStorage.length;
    
    // Clear everything
    localStorage.clear();
    
    logWithTimestamp(`[TokenManager:forceCleanAllData] Successfully cleared all ${keyCount} localStorage items`);
  } catch (error) {
    logWithTimestamp('[TokenManager:forceCleanAllData] Error clearing localStorage:', error);
  }
};

/**
 * Function to check if a token is valid by attempting to get user info
 * @returns true if valid, false if invalid
 */
export const isTokenValid = async (): Promise<boolean> => {
  logWithTimestamp('[TokenManager:isTokenValid] Validating token...');
  
  // Set flag that auth call is in progress
  authCallsInProgress = true;
  authCallStartTime = Date.now();
  
  try {
    // Create a timeout promise
    const result = await withTimeout(
      supabase.auth.getUser(),
      API_TIMEOUTS.DEFAULT,
      'Token validation timed out'
    ).then(({ data, error }) => {
      // Detailed logging of response
      if (error) {
        logWithTimestamp('[TokenManager:isTokenValid] Token validation failed with error:', error.message);
        return false;
      }
      
      if (!data.user) {
        logWithTimestamp('[TokenManager:isTokenValid] Token validation failed: No user found');
        return false;
      }
      
      // Log token details without exposing sensitive info
      logWithTimestamp('[TokenManager:isTokenValid] Token appears valid, user:', { 
        id: data.user.id,
        email: data.user.email,
        last_sign_in: data.user.last_sign_in_at
      });
      
      return true;
    });
    
    // Reset flag
    authCallsInProgress = false;
    
    return result;
  } catch (error) {
    logWithTimestamp('[TokenManager:isTokenValid] Error validating token:', error);
    // Reset flag
    authCallsInProgress = false;
    return false;
  }
};

/**
 * Checks token validity and clears invalid tokens
 * @returns true if tokens were cleared, false otherwise
 */
export const checkAndClearInvalidTokens = async (authState?: { isAuthenticated: boolean }): Promise<boolean> => {
  // Prevent concurrent checks
  if (sessionCheckLock) {
    logWithTimestamp('[TokenManager:checkAndClearInvalidTokens] Lock active, skipping check');
    return false;
  }
  
  sessionCheckLock = true;
  logWithTimestamp('[TokenManager:checkAndClearInvalidTokens] Checking token validity');
  
  try {
    const isValid = await isTokenValid();
    logWithTimestamp('[TokenManager:checkAndClearInvalidTokens] Token validation result:', isValid);
    
    // Detect mismatch between token validity and auth state
    if (!isValid && authState?.isAuthenticated) {
      logWithTimestamp('[TokenManager:checkAndClearInvalidTokens] MISMATCH: Invalid token but auth state shows authenticated. Clearing tokens.');
      clearAuthTokens();
      return true;
    }
    
    if (!isValid) {
      logWithTimestamp('[TokenManager:checkAndClearInvalidTokens] Invalid token detected, clearing all auth tokens');
      clearAuthTokens();
      return true;
    }
    
    logWithTimestamp('[TokenManager:checkAndClearInvalidTokens] Token is valid');
    return false;
  } finally {
    sessionCheckLock = false;
  }
};

/**
 * Detects if any auth calls are taking too long
 * @returns true if a hanging auth call is detected, false otherwise
 */
export const detectHangingAuthCalls = (): boolean => {
  if (authCallsInProgress && (Date.now() - authCallStartTime > AUTH_CALL_TIMEOUT)) {
    logWithTimestamp(`[TokenManager:detectHangingAuthCalls] Auth call has been running for ${Date.now() - authCallStartTime}ms, which exceeds timeout of ${AUTH_CALL_TIMEOUT}ms`);
    return true;
  }
  return false;
};

/**
 * Look for URL parameters that indicate we should clean the tokens
 * @returns whether cleaning was performed
 */
export const checkForceCleanParameters = (): boolean => {
  const urlParams = new URLSearchParams(window.location.search);
  const forceClean = urlParams.get('force_clean') === 'true';
  const resetAuth = urlParams.get('reset_auth') === 'true';
  
  if (forceClean || resetAuth) {
    logWithTimestamp(`[TokenManager:checkForceCleanParameters] Force clean requested via URL param: ${forceClean ? 'force_clean' : 'reset_auth'}`);
    clearAuthTokens();
    
    // Remove the parameter from the URL without page reload
    if (window.history && window.history.replaceState) {
      const cleanUrl = window.location.pathname + 
        (urlParams.toString() ? '?' + urlParams.toString() : '') + 
        window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
    
    return true;
  }
  
  return false;
};

/**
 * Initialize the token manager with all necessary setup
 * @param options Configuration options
 * @returns Promise that resolves when initialization is complete
 */
export const initTokenManager = async (options: {
  forceClean?: boolean;
  authState?: { isAuthenticated: boolean };
} = {}): Promise<void> => {
  const { forceClean = false, authState } = options;
  
  // Prevent multiple initializations
  if (tokenCleanerInitialized) {
    logWithTimestamp('[TokenManager:initTokenManager] Already initialized, skipping');
    return;
  }
  
  // Mark as initialized immediately to prevent race conditions
  tokenCleanerInitialized = true;
  
  logWithTimestamp('[TokenManager:initTokenManager] Initializing token manager');
  
  // Process URL parameters that might request token cleaning
  if (checkForceCleanParameters()) {
    // Already cleaned tokens based on URL params
    return;
  }
  
  try {
    // Dump the current localStorage state (keys only) for debugging
    const keys = getTokenKeys();
    logWithTimestamp('[TokenManager:initTokenManager] Current token keys:', keys);
    
    // Check for corrupted token data
    if (hasCorruptedTokenData()) {
      logWithTimestamp('[TokenManager:initTokenManager] Corrupted token data found, forcing cleanup');
      clearAuthTokens();
      return;
    }
    
    // Only force clean if explicitly requested (avoid cleaning on normal page reload)
    if (forceClean) {
      logWithTimestamp('[TokenManager:initTokenManager] Force clean requested, clearing all auth tokens');
      clearAuthTokens();
      return;
    }
    
    // Check for previous auth hang
    const hangDetected = sessionStorage.getItem('auth_hang_detected') === 'true';
    if (hangDetected && keys.length > 0) {
      logWithTimestamp('[TokenManager:initTokenManager] Previous hang detected, checking tokens');
      sessionStorage.removeItem('auth_hang_detected');
      
      // Check tokens with a safety timeout
      await checkAndClearInvalidTokens(authState);
    }
  } catch (e) {
    logWithTimestamp('[TokenManager:initTokenManager] Error during initialization:', e);
    // Recovery: if there's an initialization error, clear tokens as a safety measure
    if (forceClean) {
      clearAuthTokens();
    }
  }
  
  // Set up periodic checks for token validity
  if (typeof window !== 'undefined' && !(window as any).__tokenManagerIntervalSet) {
    // Check tokens hourly
    setInterval(async () => {
      if (!sessionCheckLock) {
        logWithTimestamp('[TokenManager:scheduled] Running scheduled token check');
        await checkAndClearInvalidTokens(authState);
      }
    }, 60 * 60 * 1000); // Check every 60 minutes
    
    // Check for hanging auth calls more frequently
    setInterval(() => {
      if (detectHangingAuthCalls()) {
        logWithTimestamp('[TokenManager:scheduled] Detected hanging auth call during scheduled check');
        sessionStorage.setItem('auth_hang_detected', 'true');
      }
    }, 30000); // Check every 30 seconds
    
    // Set flag to prevent duplicate interval setup
    (window as any).__tokenManagerIntervalSet = true;
  }
}; 