/**
 * React hook for accessing and managing authentication state
 */
import { useContext } from 'react';
import { AuthContext } from '../state/AuthContext';
import { AuthContextType } from '@/interfaces/user-interface';

/**
 * Hook to access the authentication context
 * @returns The authentication context
 * @throws Error if used outside of an AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Hook to access only authentication state
 * @returns Authentication state (isLoading, isAuthenticated, error)
 * @throws Error if used outside of an AuthProvider
 */
export const useAuthState = () => {
  const { isLoading, isAuthenticated, error } = useAuth();
  return { isLoading, isAuthenticated, error };
};

/**
 * Hook to access the current user
 * @returns The current user and profile
 * @throws Error if used outside of an AuthProvider
 */
export const useUser = () => {
  const { user, profile } = useAuth();
  return { user, profile };
};

/**
 * Hook to access authentication actions
 * @returns Authentication action methods
 * @throws Error if used outside of an AuthProvider
 */
export const useAuthActions = () => {
  const { 
    signIn, 
    signUp, 
    signOut, 
    resetPassword, 
    updateProfile, 
    clearError,
    clearTokens
  } = useAuth();
  
  return { 
    signIn, 
    signUp, 
    signOut, 
    resetPassword, 
    updateProfile, 
    clearError,
    clearTokens
  };
}; 