/**
 * Session API Module
 * 
 * Handles authentication sessions, including:
 * - Session retrieval
 * - Session refresh
 * - Authentication state change subscription
 */

import { supabase } from '../../supabase/supabase';
import { 
  logWithTimestamp, 
  withTimeout, 
  withRetries, 
  API_TIMEOUTS, 
  AuthApiError 
} from '../utils/apiUtils';
import { clearAuthTokens } from '../utils/tokenManager';
import { SignInCredentials, SignUpCredentials } from '@/interfaces/user-interface';
import { Session } from '@supabase/supabase-js';

// Token refresh constants
export const TOKEN_REFRESH = {
  INTERVAL: 60 * 60 * 1000, // 60 minutes in milliseconds
  MARGIN: 10 * 60 * 1000    // 10 minutes margin - more conservative approach
};

/**
 * Session API functions
 */
export const sessionApi = {
  /**
   * Get the current session if it exists
   * @returns The current session or null if none exists
   */
  getCurrentSession: async (): Promise<Session | null> => {
    logWithTimestamp('[sessionApi:getCurrentSession] Called');
    
    try {
      // Use standardized retry logic
      const result = await withRetries(
        async () => {
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            throw new AuthApiError(error.message, error.name, undefined, error);
          }
          
          return data.session;
        },
        {
          maxAttempts: 3,
          baseTimeout: API_TIMEOUTS.DEFAULT,
          // Only retry on network/timeout errors, not auth errors
          retryableErrorTest: (error) => {
            if (error instanceof AuthApiError) {
              return error.isNetworkError() || error.isTimeoutError();
            }
            return false;
          }
        }
      );
      
      // If we have a session, return it
      if (result) {
        logWithTimestamp('[sessionApi:getCurrentSession] Success, valid session found');
        return result;
      }
      
      // No session after retries, try refreshing as last resort
      logWithTimestamp('[sessionApi:getCurrentSession] No session found, attempting refresh as last resort');
      const refreshedSession = await sessionApi.refreshSession();
      if (refreshedSession) {
        logWithTimestamp('[sessionApi:getCurrentSession] Recovered with refreshed session');
        return refreshedSession;
      }
      
      // No session found after all attempts
      logWithTimestamp('[sessionApi:getCurrentSession] No session found');
      return null;
    } catch (error) {
      console.error('[sessionApi:getCurrentSession] Caught exception:', error);
      throw error instanceof AuthApiError ? error : AuthApiError.from(error);
    }
  },

  /**
   * Refresh the current session token
   * @returns The refreshed session or null if refresh fails
   */
  refreshSession: async (): Promise<Session | null> => {
    logWithTimestamp('[sessionApi:refreshSession] Attempting to refresh session...');
    try {
      // First check if we already have a valid session before trying to refresh
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        logWithTimestamp('[sessionApi:refreshSession] No existing session to refresh');
        return null;
      }

      // Only try to refresh if we have a session
      const { data, error } = await withTimeout(
        supabase.auth.refreshSession(),
        API_TIMEOUTS.TOKEN_REFRESH,
        'Session refresh timed out'
      );
      
      if (error) {
        console.warn('[sessionApi:refreshSession] Failed to refresh session:', error);
        return null;
      }
      
      logWithTimestamp('[sessionApi:refreshSession] Session refreshed successfully');
      return data.session;
    } catch (error) {
      console.error('[sessionApi:refreshSession] Error refreshing session:', error);
      return null;
    }
  },

  /**
   * Sign in with email and password
   * @param credentials Sign in credentials
   * @returns The session if sign in successful
   */
  signIn: async (credentials: SignInCredentials): Promise<Session | null> => {
    logWithTimestamp('[sessionApi:signIn] Attempting sign in for:', credentials.email);
    
    try {
      // Use standardized retry logic
      const result = await withRetries(
        async () => {
          const { data, error } = await supabase.auth.signInWithPassword(credentials);
          
          if (error) {
            throw new AuthApiError(error.message, error.name, undefined, error);
          }
          
          return data.session;
        },
        {
          maxAttempts: 3,
          baseTimeout: API_TIMEOUTS.EXTENDED, // Use extended timeout for sign-in
          // Only retry on network/timeout errors, not auth/credential errors
          retryableErrorTest: (error) => {
            if (error instanceof AuthApiError) {
              const message = error.message.toLowerCase();
              const code = error.code.toLowerCase();
              
              // Don't retry on invalid credentials
              if (
                message.includes('password') || 
                message.includes('email') || 
                message.includes('invalid') ||
                message.includes('credentials') ||
                code.includes('invalid_credentials')
              ) {
                return false;
              }
              
              // Retry on network/timeout issues
              return error.isNetworkError() || error.isTimeoutError();
            }
            return false;
          }
        }
      );
      
      logWithTimestamp('[sessionApi:signIn] Sign in successful');
      return result;
    } catch (error) {
      console.error('[sessionApi:signIn] Error:', error);
      clearAuthTokens(); // Clear any partial tokens on error
      throw error instanceof AuthApiError ? error : AuthApiError.from(error);
    }
  },

  /**
   * Sign up with email, password and name
   * @param credentials Sign up credentials
   * @returns The user data if sign up successful
   */
  signUp: async ({ email, password, display_name }: SignUpCredentials) => {
    logWithTimestamp(`[sessionApi:signUp] Called for email: ${email}`);
    try {
      // Clear any existing sessions before signing up
      await sessionApi.safeLocalSignOut();
      
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name // This will be used by the trigger to set display_name
            }
          }
        }),
        API_TIMEOUTS.EXTENDED, // Use extended timeout for sign up
        'Sign up timed out'
      );
      
      if (error) {
        throw new AuthApiError(error.message, error.name, undefined, error);
      }
      
      // If sign up is successful but email confirmation is required
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        logWithTimestamp('[sessionApi:signUp] Email confirmation required');
        // Consider if you want to throw an error here or let the AuthContext handle it
        // throw new Error('Please check your email to confirm your account');
      }
      
      logWithTimestamp('[sessionApi:signUp] Success');
      return data;
    } catch (error) {
      console.error('[sessionApi:signUp] Error:', error);
      throw error instanceof AuthApiError ? error : AuthApiError.from(error);
    }
  },

  /**
   * Sign out the current user
   */
  signOut: async () => {
    logWithTimestamp('[sessionApi:signOut] Called');
    try {
      const { error } = await withTimeout(
        supabase.auth.signOut({ scope: 'global' }),
        API_TIMEOUTS.DEFAULT,
        'Sign out timed out'
      );
      
      if (error) {
        console.error('[sessionApi:signOut] Error:', error);
        // Still try to clean local storage if global signout fails
        await sessionApi.safeLocalSignOut();
        throw new AuthApiError(error.message, error.name, undefined, error);
      }
      
      logWithTimestamp('[sessionApi:signOut] Success');
    } catch (error) {
      console.error('[sessionApi:signOut] Error:', error);
      // Always attempt local sign out
      await sessionApi.safeLocalSignOut();
      throw error instanceof AuthApiError ? error : AuthApiError.from(error);
    }
  },

  /**
   * Reset password for a user
   * @param email Email address
   */
  resetPassword: async (email: string) => {
    logWithTimestamp(`[sessionApi:resetPassword] Called for email: ${email}`);
    try {
      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        }),
        API_TIMEOUTS.DEFAULT,
        'Reset password timed out'
      );
      
      if (error) {
        throw new AuthApiError(error.message, error.name, undefined, error);
      }
      
      logWithTimestamp('[sessionApi:resetPassword] Success');
    } catch (error) {
      console.error('[sessionApi:resetPassword] Error:', error);
      throw error instanceof AuthApiError ? error : AuthApiError.from(error);
    }
  },

  /**
   * Update password for the current user
   * @param password New password
   * @returns true if password was updated
   */
  updatePassword: async (password: string) => {
    logWithTimestamp('[sessionApi:updatePassword] Called');
    try {
      const { error } = await withTimeout(
        supabase.auth.updateUser({
          password
        }),
        API_TIMEOUTS.DEFAULT,
        'Update password timed out'
      );
      
      if (error) {
        throw new AuthApiError(error.message, error.name, undefined, error);
      }
      
      logWithTimestamp('[sessionApi:updatePassword] Success');
      return true;
    } catch (error) {
      console.error('[sessionApi:updatePassword] Error:', error);
      throw error instanceof AuthApiError ? error : AuthApiError.from(error);
    }
  },

  /**
   * Subscribe to auth state changes
   * @param callback Function to call when auth state changes
   * @returns Subscription object for cleanup
   */
  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
    logWithTimestamp('[sessionApi:onAuthStateChange] Subscribing...');
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // Call the provided callback with the auth state change
      callback(event, session);
    });
    
    logWithTimestamp('[sessionApi:onAuthStateChange] Subscription data obtained');
    return data;
  },

  /**
   * Helper for safely signing out locally
   * This is used as a cleanup measure when other operations fail
   */
  safeLocalSignOut: async (): Promise<void> => {
    try {
      await withTimeout(
        supabase.auth.signOut({ scope: 'local' }),
        API_TIMEOUTS.QUICK,
        'Local sign out timed out'
      );
    } catch (e) {
      console.error('[sessionApi:safeLocalSignOut] Error:', e);
      // Don't rethrow since this is just a cleanup operation
    }
  }
}; 