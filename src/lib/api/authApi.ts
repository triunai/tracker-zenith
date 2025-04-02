import { supabase } from '../supabase/supabase';
import { 
  SignInCredentials,
  SignUpCredentials,
  Profile,
  UpdateProfileData
} from '@/interfaces/user-interface';

// Constants
const TIMEOUT_DEFAULT = 8000; // Increase default timeout to 8 seconds
const TIMEOUT_EXTENDED = 12000; // Extended timeout for login/signup
const TIMEOUT_QUICK = 3000; // Quick timeout for simple operations

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
 * Helper to wrap any promise with a timeout
 */
const withTimeout = async <T>(
  promise: Promise<T>, 
  timeoutMs = TIMEOUT_DEFAULT, 
  errorMessage = 'Operation timed out'
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`${errorMessage} after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
};

/**
 * Clean error handling helper that logs and rethrows
 */
const handleError = (context: string, error: any): never => {
  console.error(`[authApi:${context}] Error:`, error);
  throw error;
};

/**
 * Helper for safely signing out locally
 */
const safeLocalSignOut = async (): Promise<void> => {
  try {
    await withTimeout(
      supabase.auth.signOut({ scope: 'local' }),
      TIMEOUT_QUICK,
      'Local sign out timed out'
    );
  } catch (e) {
    console.error('[authApi:safeLocalSignOut] Error:', e);
    // Don't rethrow since this is just a cleanup operation
  }
};

export const authApi = {
  /**
   * Attempt to refresh the session token
   * @returns The refreshed session or null if refresh fails
   */
  refreshSession: async () => {
    logWithTimestamp('[authApi:refreshSession] Attempting to refresh session...');
    try {
      const { data, error } = await withTimeout(
        supabase.auth.refreshSession(),
        TIMEOUT_DEFAULT,
        'Session refresh timed out'
      );
      
      if (error) {
        console.warn('[authApi:refreshSession] Failed to refresh session:', error);
        return null;
      }
      
      logWithTimestamp('[authApi:refreshSession] Session refreshed successfully');
      return data.session;
    } catch (e) {
      console.error('[authApi:refreshSession] Error refreshing session:', e);
      return null;
    }
  },

  /**
   * Get the current user session
   */
  getCurrentSession: async () => {
    logWithTimestamp('[authApi:getCurrentSession] Called');
    try {
      const { data, error } = await withTimeout(
        supabase.auth.getSession(),
        TIMEOUT_DEFAULT,
        'Get session timed out'
      );
      
      if (error) {
        console.error('[authApi:getCurrentSession] Error:', error);
        
        // Try to refresh the session if getting it fails
        logWithTimestamp('[authApi:getCurrentSession] Attempting to recover with refreshSession');
        const refreshedSession = await authApi.refreshSession();
        if (refreshedSession) {
          logWithTimestamp('[authApi:getCurrentSession] Recovered with refreshed session');
          return refreshedSession;
        }
        
        // If refresh fails, clear any stale session data and throw the error
        await safeLocalSignOut();
        throw error;
      }
      
      logWithTimestamp('[authApi:getCurrentSession] Success, session:', data.session ? 'Exists' : 'None');
      return data.session;
    } catch (e) {
      console.error('[authApi:getCurrentSession] Caught exception:', e);
      throw e;
    }
  },

  /**
   * Get the current authenticated user and their profile
   */
  getCurrentUser: async () => {
    logWithTimestamp('[authApi:getCurrentUser] Called');
    try {
      // Get the user
      logWithTimestamp('[authApi:getCurrentUser] Calling supabase.auth.getUser()...');
      const { data: { user }, error: userError } = await withTimeout(
        supabase.auth.getUser(),
        TIMEOUT_DEFAULT,
        'Get user timed out'
      );
      
      logWithTimestamp('[authApi:getCurrentUser] supabase.auth.getUser() completed');
      
      if (userError) {
        console.error('[authApi:getCurrentUser] User Error:', userError);
        
        // Try to refresh the session if getting user fails
        logWithTimestamp('[authApi:getCurrentUser] Attempting to recover with refreshSession');
        const refreshedSession = await authApi.refreshSession();
        if (refreshedSession && refreshedSession.user) {
          // Try again with the refreshed session
          const { data: { user: refreshedUser }, error: refreshError } = await withTimeout(
            supabase.auth.getUser(),
            TIMEOUT_DEFAULT,
            'Get refreshed user timed out'
          );
          
          if (refreshError) {
            // If it still fails, clear any stale session data
            await safeLocalSignOut();
            throw refreshError;
          }
          
          if (refreshedUser) {
            logWithTimestamp('[authApi:getCurrentUser] Recovered user with refreshed session');
            
            // Handle PostgrestBuilder issue - create promise manually
            const profilePromise = Promise.resolve(
              supabase.from('user_profiles').select('*').eq('id', refreshedUser.id).single()
            ).then(result => result);
            
            const profileResult = await withTimeout(
              profilePromise,
              TIMEOUT_DEFAULT,
              'Get profile timed out'
            );
            
            return { user: refreshedUser, profile: profileResult.data };
          }
        }
        
        // If refresh fails, clear any stale session data and throw the error
        await safeLocalSignOut();
        throw userError;
      }
      
      if (!user) {
        logWithTimestamp('[authApi:getCurrentUser] No user found, returning nulls');
        return { user: null, profile: null };
      }

      // Get the user's profile - handle PostgrestBuilder issue
      logWithTimestamp(`[authApi:getCurrentUser] Getting profile for user ID: ${user.id}`);
      
      // Handle PostgrestBuilder issue - create promise manually
      const profilePromise = Promise.resolve(
        supabase.from('user_profiles').select('*').eq('id', user.id).single()
      ).then(result => result);
      
      const profileResult = await withTimeout(
        profilePromise,
        TIMEOUT_DEFAULT,
        'Get profile timed out'
      );
      
      if (profileResult.error && profileResult.error.code !== 'PGRST116') { // Ignore "not found" error
        console.error('[authApi:getCurrentUser] Profile Error:', profileResult.error);
        throw profileResult.error;
      }
      
      if (!profileResult.data) {
        logWithTimestamp(`[authApi:getCurrentUser] Profile not found for user ID: ${user.id}, returning user only`);
      }

      logWithTimestamp('[authApi:getCurrentUser] Success, returning user and profile');
      return { user, profile: profileResult.data };
    } catch (e) {
      console.error('[authApi:getCurrentUser] Caught exception:', e);
      throw e;
    }
  },

  /**
   * Sign in with email and password
   */
  signIn: async ({ email, password }: SignInCredentials) => {
    logWithTimestamp(`[authApi:signIn] Called for email: ${email}`);
    try {
      // Clear any existing sessions before signing in
      await safeLocalSignOut();
      
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password
        }),
        TIMEOUT_EXTENDED, // Use extended timeout for sign in
        'Sign in timed out'
      );
      
      if (error) {
        return handleError('signIn', error);
      }
      
      logWithTimestamp('[authApi:signIn] Success');
      return data;
    } catch (e) {
      return handleError('signIn', e);
    }
  },

  /**
   * Sign up with email, password and name
   */
  signUp: async ({ email, password, display_name }: SignUpCredentials) => {
    logWithTimestamp(`[authApi:signUp] Called for email: ${email}`);
    try {
      // Clear any existing sessions before signing up
      await safeLocalSignOut();
      
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
        TIMEOUT_EXTENDED, // Use extended timeout for sign up
        'Sign up timed out'
      );
      
      if (error) {
        return handleError('signUp', error);
      }
      
      // If sign up is successful but email confirmation is required
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        logWithTimestamp('[authApi:signUp] Email confirmation required');
        // Consider if you want to throw an error here or let the AuthContext handle it
        // throw new Error('Please check your email to confirm your account');
      }
      
      logWithTimestamp('[authApi:signUp] Success');
      return data;
    } catch (e) {
      return handleError('signUp', e);
    }
  },

  /**
   * Sign out
   */
  signOut: async () => {
    logWithTimestamp('[authApi:signOut] Called');
    try {
      const { error } = await withTimeout(
        supabase.auth.signOut({ scope: 'global' }),
        TIMEOUT_DEFAULT,
        'Sign out timed out'
      );
      
      if (error) {
        console.error('[authApi:signOut] Error:', error);
        // Still try to clean local storage if global signout fails
        await safeLocalSignOut();
        throw error;
      }
      
      logWithTimestamp('[authApi:signOut] Success');
    } catch (e) {
      return handleError('signOut', e);
    }
  },

  /**
   * Get user profile by ID
   */
  getUserProfile: async (userId: string): Promise<Profile> => {
    logWithTimestamp(`[authApi:getUserProfile] Called for ID: ${userId}`);
    try {
      // Handle PostgrestBuilder issue - create promise manually
      const profilePromise = Promise.resolve(
        supabase.from('user_profiles').select('*').eq('id', userId).single()
      ).then(result => result);
      
      const { data, error } = await withTimeout(
        profilePromise,
        TIMEOUT_DEFAULT,
        'Get profile timed out'
      );
      
      if (error) {
        return handleError('getUserProfile', error);
      }
      
      logWithTimestamp('[authApi:getUserProfile] Success');
      return data;
    } catch (e) {
      return handleError('getUserProfile', e);
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId: string, profileData: UpdateProfileData) => {
    logWithTimestamp(`[authApi:updateProfile] Called for ID: ${userId}`);
    try {
      // Handle PostgrestBuilder issue - create promise manually
      const updatePromise = Promise.resolve(
        supabase
          .from('user_profiles')
          .update({
            ...profileData,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single()
      ).then(result => result);
      
      const { data, error } = await withTimeout(
        updatePromise,
        TIMEOUT_DEFAULT,
        'Update profile timed out'
      );
      
      if (error) {
        return handleError('updateProfile', error);
      }
      
      logWithTimestamp('[authApi:updateProfile] Success');
      return data;
    } catch (e) {
      return handleError('updateProfile', e);
    }
  },

  /**
   * Reset password
   */
  resetPassword: async (email: string) => {
    logWithTimestamp(`[authApi:resetPassword] Called for email: ${email}`);
    try {
      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        }),
        TIMEOUT_DEFAULT,
        'Reset password timed out'
      );
      
      if (error) {
        return handleError('resetPassword', error);
      }
      
      logWithTimestamp('[authApi:resetPassword] Success');
    } catch (e) {
      return handleError('resetPassword', e);
    }
  },

  /**
   * Update password
   */
  updatePassword: async (password: string) => {
    logWithTimestamp('[authApi:updatePassword] Called');
    try {
      const { error } = await withTimeout(
        supabase.auth.updateUser({
          password
        }),
        TIMEOUT_DEFAULT,
        'Update password timed out'
      );
      
      if (error) {
        return handleError('updatePassword', error);
      }
      
      logWithTimestamp('[authApi:updatePassword] Success');
      return true;
    } catch (e) {
      return handleError('updatePassword', e);
    }
  },

  /**
   * Subscribe to auth changes
   */
  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    logWithTimestamp('[authApi:onAuthStateChange] Subscribing...');
    const result = supabase.auth.onAuthStateChange(callback);
    logWithTimestamp('[authApi:onAuthStateChange] Subscription data obtained');
    return result;
  }
}; 