import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { 
  User, 
  Profile, 
  AuthState, 
  SignInCredentials, 
  SignUpCredentials, 
  UpdateProfileData 
} from '@/interfaces/user-interface';
import { authApi } from '@/lib/api/authApi';
import { clearAuthTokens, initTokenCleaner } from '@/lib/utils/tokenCleaner';

// Constants to align with authApi.ts
const STATE_UPDATE_TIMEOUT = 5000; // Increased from 3000ms to accommodate longer timeouts in authApi

// Helper function for consistent timestamp logging
const logWithTimestamp = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
};

/**
 * Helper to detect auth-related errors
 */
const isAuthError = (error: any): boolean => {
  if (!error) return false;
  const message = error.message || '';
  return message.includes('JWT') || 
         message.includes('token') || 
         message.includes('session') || 
         message.includes('auth') ||
         message.includes('timed out');
};

interface AuthContextType extends AuthState {
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  clearError: () => void;
  clearTokens: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to convert Supabase user to our User type
const convertUser = (supabaseUser: SupabaseUser | null, profile: Profile | null): User | null => {
  if (!supabaseUser) return null;
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    display_name: profile?.display_name || supabaseUser.user_metadata?.display_name || '',
    created_at: supabaseUser.created_at,
    avatar_url: profile?.avatar_url || supabaseUser.user_metadata?.avatar_url
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Log state changes
  useEffect(() => {
    logWithTimestamp(`AUTH STATE CHANGE: isLoading=${state.isLoading}, isAuth=${state.isAuthenticated}, error=${state.error || 'none'}`);
  }, [state.isLoading, state.isAuthenticated, state.error]);

  // Function to clear any error
  const clearError = () => {
    logWithTimestamp('[AuthContext] Clearing error');
    setState(prev => ({ ...prev, error: null }));
  };

  // Function to explicitly clear tokens and reset auth state
  const clearTokens = () => {
    logWithTimestamp('[AuthContext] Manually clearing tokens');
    clearAuthTokens();
    setState({
      user: null,
      profile: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  };

  // Initialize auth state
  useEffect(() => {
    // Initialize token cleaner
    initTokenCleaner().catch(err => 
      console.error('[AuthContext] Error initializing token cleaner:', err)
    );

    const initAuth = async () => {
      logWithTimestamp('[AuthContext:initAuth] Starting...');
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        logWithTimestamp('[AuthContext:initAuth] Checking session...');
        const session = await authApi.getCurrentSession();
        logWithTimestamp('[AuthContext:initAuth] Session:', session ? 'Exists' : 'None');
        
        if (session) {
          logWithTimestamp('[AuthContext:initAuth] Getting current user...');
          try {
            const { user: supabaseUser, profile } = await authApi.getCurrentUser();
            const user = convertUser(supabaseUser, profile);
            logWithTimestamp('[AuthContext:initAuth] User fetched:', user?.email);
            setState({
              user,
              profile,
              isLoading: false,
              isAuthenticated: !!user,
              error: null,
            });
            logWithTimestamp('[AuthContext:initAuth] State set (authenticated)');
          } catch (userError: any) {
            // If getting user fails even with a valid session, log the error but don't clear tokens yet.
            // The session might still be valid, and onAuthStateChange might recover.
            console.error('[AuthContext:initAuth] Error fetching user with existing session:', userError);
            logWithTimestamp('[AuthContext:initAuth] Failed to fetch user details, session might be stale or network issue.');
            // Keep isAuthenticated true for now if a session existed, but flag the error.
            setState(prev => ({
              ...prev, // Keep existing user/profile data if any
              isLoading: false,
              // isAuthenticated: true, // Keep previous auth state if session was found
              error: 'Failed to load user profile. Please try refreshing or sign in again if issues persist.',
            }));
            logWithTimestamp('[AuthContext:initAuth] State set (user fetch error, session potentially valid)');
          }
        } else {
          logWithTimestamp('[AuthContext:initAuth] No active session.');
          setState({
            user: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false,
            error: null,
          });
          logWithTimestamp('[AuthContext:initAuth] State set (unauthenticated)');
        }
      } catch (error: any) {
        console.error('[AuthContext:initAuth] Error:', error);
        // Clear tokens if we get an auth error during initialization
        if (isAuthError(error)) {
          logWithTimestamp('[AuthContext:initAuth] Auth error detected, clearing tokens');
          clearAuthTokens();
        }
        setState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
          error: error.message,
        });
        logWithTimestamp('[AuthContext:initAuth] State set (error)');
      }
    };

    initAuth();

    // Set up auth state change subscription
    logWithTimestamp('[AuthContext] Setting up onAuthStateChange listener');
    const { data: { subscription } } = authApi.onAuthStateChange(async (event, session) => {
      logWithTimestamp(`[AuthContext:onAuthStateChange] Event: ${event}`);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        // User signed in or token refreshed
        logWithTimestamp('[AuthContext:onAuthStateChange] Fetching user due to SIGNED_IN/TOKEN_REFRESHED/INITIAL_SESSION...');
        try {
          const { user: supabaseUser, profile } = await authApi.getCurrentUser();
          const user = convertUser(supabaseUser, profile);
           logWithTimestamp('[AuthContext:onAuthStateChange] User fetched:', user?.email);
          setState({
            user,
            profile,
            isLoading: false,
            isAuthenticated: true,
            error: null, // Clear previous errors on successful fetch
          });
           logWithTimestamp('[AuthContext:onAuthStateChange] State updated (authenticated)');
        } catch (error: any) {
          console.error('[AuthContext:onAuthStateChange] Error fetching user:', error);
          // Don't clear tokens immediately on user fetch error. Set error state instead.
          // Only clear tokens on explicit SIGNED_OUT or specific auth errors indicating invalid session.
          // The isAuthError check here might be too broad for simple fetch failures.
          logWithTimestamp('[AuthContext:onAuthStateChange] Failed to fetch user after auth event. Setting error state.');
          // if (isAuthError(error)) {
          //   logWithTimestamp('[AuthContext:onAuthStateChange] Auth error detected, clearing tokens');
          //   clearAuthTokens(); // Avoid clearing tokens here unless error is explicitly invalid_token
          // }
          setState(prev => ({
            ...prev, // Keep potentially existing user/profile data
            error: 'Failed to update user details. Please try refreshing.',
            isLoading: false,
            isAuthenticated: prev.isAuthenticated, // Keep previous auth status unless explicitly signed out
          }));
          logWithTimestamp('[AuthContext:onAuthStateChange] State updated (user fetch error)');
        }
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        // User signed out or deleted - THIS is where we clear everything.
        logWithTimestamp('[AuthContext:onAuthStateChange] SIGNED_OUT / USER_DELETED');
        setState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
        logWithTimestamp('[AuthContext:onAuthStateChange] State updated (signed out)');
      }
    });

    // Clean up subscription
    return () => {
      logWithTimestamp('[AuthContext] Unsubscribing from onAuthStateChange');
      subscription.unsubscribe();
    };
  }, []);

  // Sign in handler
  const signIn = async (credentials: SignInCredentials) => {
    logWithTimestamp('[AuthContext:signIn] Attempting sign in for:', credentials.email);
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // First clear any existing tokens to ensure a clean state
      logWithTimestamp('[AuthContext:signIn] Clearing existing tokens before sign in');
      clearAuthTokens();
      
      logWithTimestamp('[AuthContext:signIn] Calling authApi.signIn...');
      const { user: supabaseUser } = await authApi.signIn(credentials);
      logWithTimestamp('[AuthContext:signIn] authApi.signIn successful, user:', supabaseUser?.email);
      
      if (!supabaseUser) {
        console.error('[AuthContext:signIn] No user returned from sign in API call');
        throw new Error('Sign in failed: No user data received.');
      }
      
      // Note: onAuthStateChange *should* handle the state update, 
      // but setting isLoading: false here might provide quicker feedback if needed.
      logWithTimestamp('[AuthContext:signIn] Sign in successful, waiting for onAuthStateChange.');
      // Force update loading state to ensure UI responsiveness
      setTimeout(() => {
        logWithTimestamp('[AuthContext:signIn] Checking if loading state was updated by onAuthStateChange');
        setState(prev => {
          if (prev.isLoading) {
            logWithTimestamp('[AuthContext:signIn] Loading state still true after timeout, forcing update');
            return { ...prev, isLoading: false };
          }
          return prev;
        });
      }, STATE_UPDATE_TIMEOUT);

    } catch (error: any) {
      console.error('[AuthContext:signIn] Error:', error);
      // Clear tokens if sign-in fails with an auth error
      if (isAuthError(error)) {
        logWithTimestamp('[AuthContext:signIn] Auth error detected, clearing tokens');
        clearAuthTokens();
      }
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      logWithTimestamp('[AuthContext:signIn] State updated (error)');
      throw error;
    }
  };

  // Sign up handler
  const signUp = async (credentials: SignUpCredentials) => {
    logWithTimestamp('[AuthContext:signUp] Attempting sign up for:', credentials.email);
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // First clear any existing tokens to ensure a clean state
      logWithTimestamp('[AuthContext:signUp] Clearing existing tokens before sign up');
      clearAuthTokens();
      
      logWithTimestamp('[AuthContext:signUp] Calling authApi.signUp...');
      await authApi.signUp(credentials);
      logWithTimestamp('[AuthContext:signUp] authApi.signUp successful.');
      // Don't set authenticated state here, wait for email verification / sign in
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: null 
      }));
       logWithTimestamp('[AuthContext:signUp] State updated (success, loading finished)');
    } catch (error: any) {
      console.error('[AuthContext:signUp] Error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      logWithTimestamp('[AuthContext:signUp] State updated (error)');
      throw error;
    }
  };

  // Sign out handler
  const signOut = async () => {
    logWithTimestamp('[AuthContext:signOut] Attempting sign out...');
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await authApi.signOut();
       logWithTimestamp('[AuthContext:signOut] authApi.signOut successful.');
      // Ensure all tokens are cleared on signout
      clearAuthTokens();
      // Set the state directly rather than waiting for onAuthStateChange
      setState({
        user: null,
        profile: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
       logWithTimestamp('[AuthContext:signOut] State updated (signed out)');
    } catch (error: any) {
      console.error('[AuthContext:signOut] Error:', error);
      // Always clear tokens on signout, even if there's an error
      clearAuthTokens();
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
        user: null,
        profile: null,
        isAuthenticated: false,
      }));
      logWithTimestamp('[AuthContext:signOut] State updated (error, but tokens cleared)');
      throw error;
    }
  };

  // Reset password handler
  const resetPassword = async (email: string) => {
     logWithTimestamp('[AuthContext:resetPassword] Attempting password reset for:', email);
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await authApi.resetPassword(email);
       logWithTimestamp('[AuthContext:resetPassword] authApi.resetPassword successful.');
      setState(prev => ({ ...prev, isLoading: false }));
       logWithTimestamp('[AuthContext:resetPassword] State updated (success)');
    } catch (error: any) {
      console.error('[AuthContext:resetPassword] Error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
       logWithTimestamp('[AuthContext:resetPassword] State updated (error)');
      throw error;
    }
  };

  // Update profile handler
  const updateProfile = async (data: UpdateProfileData) => {
     logWithTimestamp('[AuthContext:updateProfile] Attempting profile update');
    if (!state.user) {
       logWithTimestamp('[AuthContext:updateProfile] Error: User not authenticated.');
      throw new Error('User must be authenticated to update profile');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const updatedProfile = await authApi.updateProfile(state.user.id, data);
       logWithTimestamp('[AuthContext:updateProfile] authApi.updateProfile successful.');
      setState(prev => ({
        ...prev,
        profile: updatedProfile,
        isLoading: false,
      }));
       logWithTimestamp('[AuthContext:updateProfile] State updated (success)');
    } catch (error: any) {
      console.error('[AuthContext:updateProfile] Error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
       logWithTimestamp('[AuthContext:updateProfile] State updated (error)');
      throw error;
    }
  };
  
  // Log state changes for debugging
  // useEffect(() => {
  //   console.log('[AuthContext] State changed:', state);
  // }, [state]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
        clearError,
        clearTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 