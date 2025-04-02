import { useAuth } from '@/context/AuthContext';

/**
 * Custom hook to get the current user ID
 * @returns The current user ID or undefined if not authenticated
 */
export const useCurrentUser = () => {
  const { user, isAuthenticated } = useAuth();
  
  // Return the user ID if authenticated
  const userId = isAuthenticated && user ? user.id : undefined;
  
  return { userId, isAuthenticated };
}; 