/**
 * Authentication Context
 * 
 * Provides authentication state and actions to the application
 */
import React, { createContext, useReducer, useEffect, useCallback } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { 
  AuthState, 
  AuthContextType, 
  SignInCredentials, 
  SignUpCredentials, 
  UpdateProfileData 
} from '@/interfaces/user-interface';

import { sessionApi, TOKEN_REFRESH } from '../api/sessionApi';
import { userApi, convertUser } from '../api/userApi';
import { initTokenManager, clearAuthTokens } from '../utils/tokenManager';
import { logWithTimestamp, AuthApiError } from '../utils/apiUtils';
import { authReducer, initialAuthState, authActions, isAuthError } from './authState';
import { supabase } from '../../supabase/supabase';

// Constants
const STATE_UPDATE_TIMEOUT = 8000; // 8 seconds timeout for state updates

// Create context with undefined default value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider component
 * Manages authentication state and provides auth-related actions
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use reducer for state management
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  
  // Track if initial session check has completed
  const initialCheckComplete = React.useRef(false);
  
  // Clear any error
  const clearError = useCallback(() => {
    logWithTimestamp('[AuthContext] Clearing error');
    dispatch(authActions.clearError());
  }, []);

  // Explicitly clear tokens and reset auth state
  const clearTokens = useCallback(() => {
    logWithTimestamp('[AuthContext] Manually clearing tokens');
    clearAuthTokens();
    dispatch(authActions.reset());
  }, []);

  // Check for initial session
  const checkInitialSession = useCallback(async () => {
    logWithTimestamp('[AuthContext:checkInitialSession] Starting...');
    try {
      dispatch(authActions.setLoading(true));

      // Directly check for a session
      const session = await sessionApi.getCurrentSession();

      // If no session, mark initial check as complete and exit
      if (!session) { 
        logWithTimestamp('[AuthContext:checkInitialSession] No session found.');
        dispatch(authActions.setUnauthenticated());
        initialCheckComplete.current = true;
        return;
      }
      
      // Session exists
      logWithTimestamp('[AuthContext:checkInitialSession] Session found. Fetching user details...');
      try {
        const { user: supabaseUser, profile } = await userApi.getCurrentUser();
        const user = convertUser(supabaseUser, profile);
        
        logWithTimestamp('[AuthContext:checkInitialSession] User details fetched. Setting state.');
        if (user) {
          dispatch(authActions.setAuthenticated(user, profile));
        } else {
          // This should be rare - we have a session but couldn't get user details
          dispatch(authActions.setUnauthenticated('Session exists but user details could not be loaded.'));
        }
        initialCheckComplete.current = true;
      } catch (userError) {
        console.error('[AuthContext:checkInitialSession] Error fetching user details:', userError);
        // Session valid but profile fetch failed
        dispatch(authActions.setError('Failed to load profile. Session might be valid.'));
        initialCheckComplete.current = true;
      }
      
    } catch (error: any) {
      console.error('[AuthContext:checkInitialSession] Unexpected error:', error);
      dispatch(authActions.setUnauthenticated('An unexpected error occurred during authentication check.'));
      initialCheckComplete.current = true;
    }
  }, []);

  // Sign in handler
  const signIn = useCallback(async (credentials: SignInCredentials) => {
    logWithTimestamp('[AuthContext:signIn] Attempting sign in for:', credentials.email);
    try {
      dispatch(authActions.setLoading(true));
      
      // Clear any existing tokens first
      clearAuthTokens();
      
      // Call the sign-in API
      await sessionApi.signIn(credentials);
      logWithTimestamp('[AuthContext:signIn] Sign in API call successful, waiting for onAuthStateChange.');
      
      // Timeout to ensure loading doesn't hang indefinitely if listener fails
      setTimeout(() => {
        // Check state to see if it's still loading
        if (state.isLoading) {
          logWithTimestamp('[AuthContext:signIn] Still loading after timeout, forcing state update');
          dispatch(authActions.setLoading(false));
        }
      }, STATE_UPDATE_TIMEOUT);
    } catch (error: any) {
      console.error('[AuthContext:signIn] Error:', error);
      const authError = error instanceof AuthApiError ? error : AuthApiError.from(error);
      
      if (isAuthError(authError)) {
        clearAuthTokens();
      }
      
      dispatch(authActions.setError(authError.message));
      throw authError;
    }
  }, [state.isLoading]);

  // Sign up handler
  const signUp = useCallback(async (credentials: SignUpCredentials) => {
    logWithTimestamp('[AuthContext:signUp] Attempting sign up for:', credentials.email);
    try {
      dispatch(authActions.setLoading(true));
      
      // First clear any existing tokens to ensure a clean state
      logWithTimestamp('[AuthContext:signUp] Clearing existing tokens before sign up');
      clearAuthTokens();
      
      logWithTimestamp('[AuthContext:signUp] Calling sessionApi.signUp...');
      await sessionApi.signUp(credentials);
      logWithTimestamp('[AuthContext:signUp] sessionApi.signUp successful.');
      
      // Don't set authenticated state here, wait for email verification / sign in
      dispatch(authActions.setLoading(false));
      logWithTimestamp('[AuthContext:signUp] State updated (success, loading finished)');
    } catch (error: any) {
      console.error('[AuthContext:signUp] Error:', error);
      const authError = error instanceof AuthApiError ? error : AuthApiError.from(error);
      
      dispatch(authActions.setError(authError.message));
      logWithTimestamp('[AuthContext:signUp] State updated (error)');
      throw authError;
    }
  }, []);

  // Sign out handler
  const signOut = useCallback(async () => {
    logWithTimestamp('[AuthContext:signOut] Attempting sign out...');
    try {
      dispatch(authActions.setLoading(true));
      
      await sessionApi.signOut();
      logWithTimestamp('[AuthContext:signOut] sessionApi.signOut successful.');
      
      // Ensure all tokens are cleared on signout
      clearAuthTokens();
      
      // Set the state directly rather than waiting for onAuthStateChange
      dispatch(authActions.setUnauthenticated());
      logWithTimestamp('[AuthContext:signOut] State updated (signed out)');
    } catch (error: any) {
      console.error('[AuthContext:signOut] Error:', error);
      const authError = error instanceof AuthApiError ? error : AuthApiError.from(error);
      
      // Always clear tokens on signout, even if there's an error
      clearAuthTokens();
      dispatch(authActions.setUnauthenticated(authError.message));
      
      logWithTimestamp('[AuthContext:signOut] State updated (error, but tokens cleared)');
      throw authError;
    }
  }, []);

  // Reset password handler
  const resetPassword = useCallback(async (email: string) => {
    logWithTimestamp('[AuthContext:resetPassword] Attempting password reset for:', email);
    try {
      dispatch(authActions.setLoading(true));
      
      await sessionApi.resetPassword(email);
      logWithTimestamp('[AuthContext:resetPassword] sessionApi.resetPassword successful.');
      
      dispatch(authActions.setLoading(false));
      logWithTimestamp('[AuthContext:resetPassword] State updated (success)');
    } catch (error: any) {
      console.error('[AuthContext:resetPassword] Error:', error);
      const authError = error instanceof AuthApiError ? error : AuthApiError.from(error);
      
      dispatch(authActions.setError(authError.message));
      logWithTimestamp('[AuthContext:resetPassword] State updated (error)');
      throw authError;
    }
  }, []);

  // Update profile handler
  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    logWithTimestamp('[AuthContext:updateProfile] Attempting profile update');
    if (!state.user) {
      logWithTimestamp('[AuthContext:updateProfile] Error: User not authenticated.');
      throw new Error('User must be authenticated to update profile');
    }

    try {
      dispatch(authActions.setLoading(true));
      
      const updatedProfile = await userApi.updateProfile(state.user.id, data);
      logWithTimestamp('[AuthContext:updateProfile] userApi.updateProfile successful.');
      
      dispatch(authActions.updateProfile(updatedProfile));
      dispatch(authActions.setLoading(false));
      
      logWithTimestamp('[AuthContext:updateProfile] State updated (success)');
    } catch (error: any) {
      console.error('[AuthContext:updateProfile] Error:', error);
      const authError = error instanceof AuthApiError ? error : AuthApiError.from(error);
      
      dispatch(authActions.setError(authError.message));
      logWithTimestamp('[AuthContext:updateProfile] State updated (error)');
      throw authError;
    }
  }, [state.user]);

  // Set up auth subscription and token refresh
  useEffect(() => {
    // Initialize token manager with state for coordination
    initTokenManager({ 
      authState: { isAuthenticated: state.isAuthenticated } 
    }).catch(err => 
      console.error('[AuthContext] Error initializing token manager:', err)
    );

    let isMounted = true; // Flag to prevent state updates on unmounted component
    
    // Start initial session check
    checkInitialSession();

    // Set up auth state change subscription
    logWithTimestamp('[AuthContext] Setting up onAuthStateChange listener');
    const { subscription } = sessionApi.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      logWithTimestamp(`[AuthContext:onAuthStateChange] Event: ${event}`);
      
      // For authentication events, update state unless initial check already did it
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        // Skip if initial check is still pending to avoid race condition
        if (event === 'INITIAL_SESSION' && !initialCheckComplete.current) {
          logWithTimestamp('[AuthContext:onAuthStateChange] Skipping INITIAL_SESSION event, waiting for initial check');
          return;
        }
        
        logWithTimestamp('[AuthContext:onAuthStateChange] Fetching user due to auth event...');
        try {
          // Use session from event if available, otherwise fetch fresh user
          const { user: supabaseUser, profile } = session?.user 
            ? await userApi.getCurrentUser() // Fetch profile based on session user
            : { user: null, profile: null }; // Or assume null if no session in event
          
          const user = convertUser(supabaseUser, profile);
          logWithTimestamp('[AuthContext:onAuthStateChange] User fetched/determined:', user?.email);
          
          if (user) {
            dispatch(authActions.setAuthenticated(user, profile));
          } else {
            dispatch(authActions.setUnauthenticated());
          }
          
          logWithTimestamp('[AuthContext:onAuthStateChange] State updated (authenticated/refreshed)');
        } catch (error: any) {
          console.error('[AuthContext:onAuthStateChange] Error fetching user:', error);
          const authError = error instanceof AuthApiError ? error : AuthApiError.from(error);
          
          dispatch(authActions.setError(authError.message));
          logWithTimestamp('[AuthContext:onAuthStateChange] State updated (user fetch error)');
        }
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        logWithTimestamp('[AuthContext:onAuthStateChange] SIGNED_OUT / USER_DELETED');
        dispatch(authActions.setUnauthenticated());
        logWithTimestamp('[AuthContext:onAuthStateChange] State updated (signed out)');
      }
    });

    // Set up token refresh timer
    const refreshTokenTimer = setInterval(async () => {
      logWithTimestamp('[AuthContext:tokenRefresh] Attempting scheduled token refresh');
      try {
        if (state.isAuthenticated) {
          const refreshedSession = await sessionApi.refreshSession();
          if (!refreshedSession) {
            logWithTimestamp('[AuthContext:tokenRefresh] Failed to refresh token, session may be invalid');
            // Only clear tokens if we're certain there's an issue
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
              logWithTimestamp('[AuthContext:tokenRefresh] No valid session found, clearing tokens');
              clearAuthTokens();
              if (isMounted) {
                dispatch(authActions.setUnauthenticated('Your session has expired. Please sign in again.'));
              }
            }
          } else {
            logWithTimestamp('[AuthContext:tokenRefresh] Token refreshed successfully');
          }
        }
      } catch (error) {
        console.error('[AuthContext:tokenRefresh] Error during token refresh:', error);
        // Only log the error, don't sign out immediately as it might be a temporary issue
      }
    }, TOKEN_REFRESH.INTERVAL - TOKEN_REFRESH.MARGIN);

    // Cleanup function
    return () => {
      isMounted = false;
      clearInterval(refreshTokenTimer);
      logWithTimestamp('[AuthContext] Unsubscribing from onAuthStateChange');
      subscription.unsubscribe();
    };
  }, [checkInitialSession, state.isAuthenticated]);

  // Log state changes for debugging
  useEffect(() => {
    logWithTimestamp(`[AuthContext] State updated: isLoading=${state.isLoading}, isAuth=${state.isAuthenticated}, error=${state.error || 'none'}`);
  }, [state.isLoading, state.isAuthenticated, state.error]);

  // Combine state and actions into context value
  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    clearError,
    clearTokens,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}; 