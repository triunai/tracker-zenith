import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  Profile, 
  AuthState, 
  SignInCredentials, 
  SignUpCredentials, 
  UpdateProfileData 
} from '@/interfaces/user-interface';
import { authApi } from '@/services/authApi';

interface AuthContextType extends AuthState {
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Function to clear any error
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        const { user, profile } = await authApi.getCurrentUser();
        
        setState({
          user,
          profile,
          isLoading: false,
          isAuthenticated: !!user,
          error: null,
        });
      } catch (error: any) {
        console.error('Auth initialization error:', error);
        setState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
          error: error.message,
        });
      }
    };

    initAuth();

    // Set up auth state change subscription
    const { data: { subscription } } = authApi.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // User signed in or token refreshed
        try {
          const { user, profile } = await authApi.getCurrentUser();
          setState({
            user,
            profile,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        } catch (error: any) {
          console.error('Auth state change error:', error);
          setState(prev => ({
            ...prev,
            error: error.message,
            isLoading: false,
          }));
        }
      } else if (event === 'SIGNED_OUT') {
        // User signed out
        setState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    });

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in handler
  const signIn = async (credentials: SignInCredentials) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await authApi.signIn(credentials);
      // The auth state will be updated by the onAuthStateChange listener
    } catch (error: any) {
      console.error('Sign in error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  // Sign up handler
  const signUp = async (credentials: SignUpCredentials) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await authApi.signUp(credentials);
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      console.error('Sign up error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  // Sign out handler
  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await authApi.signOut();
      // The auth state will be updated by the onAuthStateChange listener
    } catch (error: any) {
      console.error('Sign out error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  // Reset password handler
  const resetPassword = async (email: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await authApi.resetPassword(email);
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      console.error('Reset password error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  // Update profile handler
  const updateProfile = async (data: UpdateProfileData) => {
    if (!state.user) {
      throw new Error('User must be authenticated to update profile');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const updatedProfile = await authApi.updateProfile(state.user.id, data);
      setState(prev => ({
        ...prev,
        profile: updatedProfile,
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('Update profile error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  const value = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 