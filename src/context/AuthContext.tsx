/**
 * Authentication Context (Legacy file)
 * 
 * This file has been refactored into a modular system.
 * It now re-exports the context and provider from the new auth module.
 */

// Re-export everything from the new auth module
export { 
  AuthContext, 
  AuthProvider, 
  useAuth, 
  useAuthState,
  useUser,
  useAuthActions
} from '@/lib/auth';

// This ensures backward compatibility with components still using imports from this file 