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
    initTokenCleaner().catch(err => 
      console.error('[AuthContext] Error initializing token cleaner:', err)
    );

    let isMounted = true; // Flag to prevent state updates on unmounted component

    const checkInitialSession = async () => {
      logWithTimestamp('[AuthContext:checkInitialSession] Starting...');
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Directly check for a session - authApi.getCurrentSession returns Session | null
        const session = await authApi.getCurrentSession();

        // No sessionError object here, check if session is null
        if (!session) { 
          // No session found
          logWithTimestamp('[AuthContext:checkInitialSession] No session found.');
          if (isMounted) {
            setState({
              user: null,
              profile: null,
              isLoading: false,
              isAuthenticated: false,
              error: null,
            });
          }
          return; // Stop here if no session
        }
        
        // Session exists
        logWithTimestamp('[AuthContext:checkInitialSession] Session found. Fetching user details...');
        try {
          const { user: supabaseUser, profile } = await authApi.getCurrentUser();
          const user = convertUser(supabaseUser, profile);
          if (isMounted) {
            logWithTimestamp('[AuthContext:checkInitialSession] User details fetched. Setting state.');
            setState({
              user,
              profile,
              isLoading: false,
              isAuthenticated: true,
              error: null,
            });
          }
        } catch (userError) {
          console.error('[AuthContext:checkInitialSession] Error fetching user details:', userError);
          if (isMounted) {
             setState(prev => ({
               ...prev, 
               isLoading: false,
               isAuthenticated: true, 
               error: 'Failed to load profile. Session might be valid.'
             }));
          }
        }
        
      } catch (error: any) {
        console.error('[AuthContext:checkInitialSession] Unexpected error:', error);
        if (isMounted) {
          setState({
            user: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false,
            error: 'An unexpected error occurred during authentication check.',
          });
        }
      }
    };

    checkInitialSession();

    // Set up auth state change subscription
    logWithTimestamp('[AuthContext] Setting up onAuthStateChange listener');
    const { data: { subscription } } = authApi.onAuthStateChange(async (event, session) => {
       if (!isMounted) return;

      logWithTimestamp(`[AuthContext:onAuthStateChange] Event: ${event}`);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        logWithTimestamp('[AuthContext:onAuthStateChange] Fetching user due to auth event...');
        try {
           // Use session from event if available, otherwise fetch fresh user
           const { user: supabaseUser, profile } = session?.user 
            ? await authApi.getCurrentUser() // Fetch profile based on session user
            : { user: null, profile: null }; // Or assume null if no session in event
          
          const user = convertUser(supabaseUser, profile);
          logWithTimestamp('[AuthContext:onAuthStateChange] User fetched/determined:', user?.email);
          setState({
            user,
            profile,
            isLoading: false,
            isAuthenticated: !!user,
            error: null,
          });
          logWithTimestamp('[AuthContext:onAuthStateChange] State updated (authenticated/refreshed)');
        } catch (error: any) {
          console.error('[AuthContext:onAuthStateChange] Error fetching user:', error);
          setState(prev => ({
            ...prev, 
            error: 'Failed to update user details.',
            isLoading: false,
          }));
          logWithTimestamp('[AuthContext:onAuthStateChange] State updated (user fetch error)');
        }
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
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

    return () => {
      isMounted = false;
      logWithTimestamp('[AuthContext] Unsubscribing from onAuthStateChange');
      subscription.unsubscribe();
    };
  }, []);

  // Sign in handler - Define isMounted OUTSIDE useEffect if needed here, 
  // but relying on onAuthStateChange is usually better than timeouts.
  // For simplicity, let's remove the isMounted check from the timeout as it's complex scope-wise.
  // The listener should handle the final state.
  const signIn = async (credentials: SignInCredentials) => {
    logWithTimestamp('[AuthContext:signIn] Attempting sign in for:', credentials.email);
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      clearAuthTokens();
      await authApi.signIn(credentials);
      logWithTimestamp('[AuthContext:signIn] Sign in API call successful, waiting for onAuthStateChange.');
      // Timeout to ensure loading doesn't hang indefinitely if listener fails
      setTimeout(() => {
        // If still loading after timeout, force loading false. 
        // This doesn't need isMounted check if we just modify state based on previous state.
         setState(prev => prev.isLoading ? { ...prev, isLoading: false } : prev);
      }, STATE_UPDATE_TIMEOUT);
    } catch (error: any) {
      console.error('[AuthContext:signIn] Error:', error);
      if (isAuthError(error)) {
        clearAuthTokens();
      }
      // Update state directly without isMounted check - safe if just setting based on prev state
      setState(prev => ({ ...prev, isLoading: false, error: error.message }));
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