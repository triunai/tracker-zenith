/**
 * User API Module
 * 
 * Handles user data and profile management
 */

import { supabase } from '../../supabase/supabase';
import { 
  logWithTimestamp, 
  withTimeout, 
  withRetries, 
  API_TIMEOUTS, 
  AuthApiError 
} from '../utils/apiUtils';
import { User, Profile, UpdateProfileData } from '@/interfaces/user-interface';
import { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * Convert a Supabase user to our User type
 */
export const convertUser = (supabaseUser: SupabaseUser | null, profile: Profile | null): User | null => {
  if (!supabaseUser) return null;
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    display_name: profile?.display_name || supabaseUser.user_metadata?.display_name || '',
    created_at: supabaseUser.created_at,
    avatar_url: profile?.avatar_url || supabaseUser.user_metadata?.avatar_url
  };
};

/**
 * User API functions
 */
export const userApi = {
  /**
   * Get the current authenticated user
   * @returns The current user and profile data
   */
  getCurrentUser: async () => {
    logWithTimestamp('[userApi:getCurrentUser] Called');
    
    // Use retry logic for better reliability
    return withRetries(
      async () => {
        // Get the user
        logWithTimestamp('[userApi:getCurrentUser] Calling supabase.auth.getUser()...');
        const { data: { user }, error: userError } = await withTimeout(
          supabase.auth.getUser(),
          API_TIMEOUTS.DEFAULT,
          'Get user timed out'
        );
        
        logWithTimestamp('[userApi:getCurrentUser] supabase.auth.getUser() completed');
        
        if (userError) {
          throw new AuthApiError(userError.message, userError.name, undefined, userError);
        }
        
        if (!user) {
          logWithTimestamp('[userApi:getCurrentUser] No user found, returning nulls');
          return { user: null, profile: null };
        }

        // Get the user's profile
        logWithTimestamp(`[userApi:getCurrentUser] Getting profile for user ID: ${user.id}`);
        
        const profilePromise = Promise.resolve(
          supabase.from('user_profiles').select('*').eq('id', user.id).single()
        ).then(result => result);
        
        const { data: profile, error: profileError } = await withTimeout(
          profilePromise,
          API_TIMEOUTS.DEFAULT,
          'Get profile timed out'
        );
        
        if (profileError && profileError.code !== 'PGRST116') { // Ignore "not found" error
          throw new AuthApiError(
            profileError.message, 
            profileError.code, 
            undefined,
            profileError
          );
        }
        
        if (!profile) {
          logWithTimestamp(`[userApi:getCurrentUser] Profile not found for user ID: ${user.id}, returning user only`);
        }

        logWithTimestamp('[userApi:getCurrentUser] Success, returning user and profile');
        return { user, profile };
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
  },
  
  /**
   * Get user profile by ID
   * @param userId User ID
   * @returns The user profile
   */
  getUserProfile: async (userId: string): Promise<Profile> => {
    logWithTimestamp(`[userApi:getUserProfile] Called for ID: ${userId}`);
    
    return withRetries(
      async () => {
        // Handle PostgrestBuilder issue - create promise manually
        const profilePromise = Promise.resolve(
          supabase.from('user_profiles').select('*').eq('id', userId).single()
        ).then(result => result);
        
        const { data, error } = await withTimeout(
          profilePromise,
          API_TIMEOUTS.DEFAULT,
          'Get profile timed out'
        );
        
        if (error) {
          throw new AuthApiError(
            error.message, 
            error.code, 
            undefined,
            error
          );
        }
        
        logWithTimestamp('[userApi:getUserProfile] Success');
        return data;
      },
      {
        maxAttempts: 2,
        baseTimeout: API_TIMEOUTS.DEFAULT
      }
    );
  },

  /**
   * Update user profile
   * @param userId User ID
   * @param profileData Profile data to update
   * @returns Updated profile
   */
  updateProfile: async (userId: string, profileData: UpdateProfileData): Promise<Profile> => {
    logWithTimestamp(`[userApi:updateProfile] Called for ID: ${userId}`);
    
    return withRetries(
      async () => {
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
          API_TIMEOUTS.DEFAULT,
          'Update profile timed out'
        );
        
        if (error) {
          throw new AuthApiError(
            error.message, 
            error.code, 
            undefined,
            error
          );
        }
        
        logWithTimestamp('[userApi:updateProfile] Success');
        return data;
      },
      {
        maxAttempts: 2,
        baseTimeout: API_TIMEOUTS.DEFAULT
      }
    );
  }
}; 