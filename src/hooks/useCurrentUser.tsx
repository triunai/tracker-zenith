import { useUser } from '@/lib/auth';

/**
 * Custom hook to get the current user ID
 * @returns The current user ID or undefined if not authenticated
 */
export const useCurrentUser = () => {
  return useUser();
}; 