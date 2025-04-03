/**
 * Authentication State Management
 * 
 * Defines types, actions, and utilities for managing authentication state
 */

import { AuthState, User, Profile } from '@/interfaces/user-interface';
import { logWithTimestamp } from '../utils/apiUtils';

/**
 * Auth state action types
 */
export enum AuthActionType {
  INIT = 'INIT',
  SET_LOADING = 'SET_LOADING',
  SET_AUTHENTICATED = 'SET_AUTHENTICATED',
  SET_UNAUTHENTICATED = 'SET_UNAUTHENTICATED',
  SET_ERROR = 'SET_ERROR',
  CLEAR_ERROR = 'CLEAR_ERROR',
  UPDATE_PROFILE = 'UPDATE_PROFILE',
  RESET = 'RESET'
}

/**
 * Auth state action interface
 */
export interface AuthAction {
  type: AuthActionType;
  payload?: any;
}

/**
 * Initial auth state
 */
export const initialAuthState: AuthState = {
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

/**
 * Auth state reducer for managing state transitions
 */
export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case AuthActionType.INIT:
      return initialAuthState;
    
    case AuthActionType.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        // Clear error when setting loading to true
        error: action.payload === true ? null : state.error,
      };
    
    case AuthActionType.SET_AUTHENTICATED:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        profile: action.payload.profile,
        error: null,
      };
    
    case AuthActionType.SET_UNAUTHENTICATED:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        profile: null,
        error: action.payload || null,
      };
    
    case AuthActionType.SET_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    
    case AuthActionType.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    case AuthActionType.UPDATE_PROFILE:
      return {
        ...state,
        profile: action.payload,
      };
    
    case AuthActionType.RESET:
      return {
        ...initialAuthState,
        isLoading: false,
      };
    
    default:
      return state;
  }
};

/**
 * Action creators for auth state
 */
export const authActions = {
  setLoading: (isLoading: boolean): AuthAction => ({
    type: AuthActionType.SET_LOADING,
    payload: isLoading,
  }),
  
  setAuthenticated: (user: User, profile: Profile | null): AuthAction => ({
    type: AuthActionType.SET_AUTHENTICATED,
    payload: { user, profile },
  }),
  
  setUnauthenticated: (errorMessage?: string): AuthAction => ({
    type: AuthActionType.SET_UNAUTHENTICATED,
    payload: errorMessage,
  }),
  
  setError: (error: string): AuthAction => ({
    type: AuthActionType.SET_ERROR,
    payload: error,
  }),
  
  clearError: (): AuthAction => ({
    type: AuthActionType.CLEAR_ERROR,
  }),
  
  updateProfile: (profile: Profile): AuthAction => ({
    type: AuthActionType.UPDATE_PROFILE,
    payload: profile,
  }),
  
  reset: (): AuthAction => ({
    type: AuthActionType.RESET,
  }),
};

/**
 * Helper to detect auth-related errors
 */
export const isAuthError = (error: any): boolean => {
  if (!error) return false;
  
  // Specific Supabase auth error codes
  const supabaseAuthCodes = [
    'invalid_refresh_token',
    'invalid_access_token',
    'token_expired',
    'auth_session_missing',
    'user_not_found',
    'email_not_confirmed',
    'invalid_login_credentials',
    'invalid_grant',
    'invalid_request',
    'unauthorized'
  ];
  
  // Get error code and message
  const message = (error.message || '').toLowerCase();
  const code = (error.code || '').toLowerCase();
  
  // Check for specific Supabase codes first
  if (supabaseAuthCodes.some(authCode => code.includes(authCode))) {
    logWithTimestamp(`[AuthState] Auth error detected by code: ${code}`);
    return true;
  }
  
  // Common auth error patterns in message
  const commonAuthPatterns = [
    'auth', 'jwt', 'token', 'session',
    'invalid_token', 'token_expired', 'token_refresh',
    'no_user', 'invalid_refresh_token', 'expired',
    'timed out', 'unauthorized', 'permission', 'access',
    'sign in', 'sign out', 'login', 'logout'
  ];
  
  const isMessageMatch = commonAuthPatterns.some(pattern => message.includes(pattern));
  if (isMessageMatch) {
    logWithTimestamp(`[AuthState] Auth error detected by message pattern: ${error.message}`);
  }
  
  return isMessageMatch;
}; 