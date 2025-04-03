/**
 * Authentication System
 * 
 * This module is the entry point for the authentication system.
 * It re-exports all the necessary components, hooks, and utilities.
 */

// Re-export the context and provider
export { AuthContext, AuthProvider } from './state/AuthContext';

// Re-export hooks
export { 
  useAuth,
  useAuthState,
  useUser,
  useAuthActions
} from './hooks/useAuth';

// Re-export API functions for direct use if needed
export { sessionApi } from './api/sessionApi';
export { userApi, convertUser } from './api/userApi';

// Re-export token management utilities
export { 
  initTokenManager,
  clearAuthTokens,
  checkAndClearInvalidTokens
} from './utils/tokenManager';

// Re-export auth state utilities
export { 
  isAuthError, 
  authReducer, 
  initialAuthState, 
  authActions 
} from './state/authState';

// Re-export API utilities
export { 
  API_TIMEOUTS, 
  logWithTimestamp, 
  withTimeout, 
  withRetries, 
  AuthApiError 
} from './utils/apiUtils'; 