import { createClient } from '@supabase/supabase-js';

// Use Vite's method for environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Basic check if variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Check environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).');
  // Optionally throw an error or handle appropriately
}

// Create Supabase client with persistent sessions and automatic token refresh
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Explicitly set persistence options (defaults are usually true)
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // Important for handling magic links, OAuth redirects
    storage: {
      // Use localStorage by default but provide fallback
      getItem: (key) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error('Error accessing localStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Error writing to localStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing from localStorage:', error);
        }
      }
    }
  }
});