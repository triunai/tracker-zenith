import { supabase } from '@/lib/supabase/supabase';
import { SignInCredentials, SignUpCredentials, UpdateProfileData, User, Profile } from '@/interfaces/user-interface';
import { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * Transform Supabase user to our application User model
 */
const transformUser = (supabaseUser: SupabaseUser): User => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    display_name: supabaseUser.user_metadata?.display_name || '',
    created_at: supabaseUser.created_at,
    avatar_url: supabaseUser.user_metadata?.avatar_url
  };
};

/**
 * Authentication API service for handling user authentication with Supabase
 */
export const authApi = {
  /**
   * Sign in a user with email and password
   */
  async signIn({ email, password }: SignInCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },
  
  /**
   * Sign up a new user with email, password, and profile data
   */
  async signUp({ email, password, display_name }: SignUpCredentials) {
    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name
        }
      }
    });
    
    if (authError) {
      throw new Error(authError.message);
    }
    
    return authData;
  },
  
  /**
   * Sign out the current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return true;
  },
  
  /**
   * Reset a user's password
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return true;
  },
  
  /**
   * Get the current user and their profile
   */
  async getCurrentUser() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error(sessionError.message);
    }
    
    if (!session) {
      return { user: null, profile: null };
    }
    
    // Transform the Supabase user to our User model
    const user = transformUser(session.user);
    
    // Get the user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
    }
    
    return {
      user,
      profile: profile as Profile
    };
  },
  
  /**
   * Update a user's profile
   */
  async updateProfile(user_id: string, data: UpdateProfileData) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('user_id', user_id)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return profile as Profile;
  },
  
  /**
   * Set up a listener for auth state changes
   */
  onAuthStateChange(callback: (event: any, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}; 