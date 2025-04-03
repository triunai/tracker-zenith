/**
 * API Utilities for Authentication
 * 
 * This module provides utility functions for API calls, including:
 * - Promise timeout wrapping
 * - Retry logic with exponential backoff
 * - API error handling
 */

// Common timeout constants (in milliseconds)
export const API_TIMEOUTS = {
  DEFAULT: 10000,     // 10 seconds - default timeout for most operations
  EXTENDED: 15000,    // 15 seconds - for operations that might take longer (signup, etc)
  QUICK: 5000,        // 5 seconds - for simple/quick operations
  SHORT: 3000,        // 3 seconds - for very quick checks
  TOKEN_REFRESH: 8000 // 8 seconds - specific to token refresh operations
};

// Helper function for consistent timestamp logging
export const logWithTimestamp = (message: string, data?: any): void => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
};

/**
 * Custom error class for API operations
 */
export class AuthApiError extends Error {
  code: string;
  status?: number;
  originalError?: any;

  constructor(message: string, code: string = 'unknown_error', status?: number, originalError?: any) {
    super(message);
    this.name = 'AuthApiError';
    this.code = code;
    this.status = status;
    this.originalError = originalError;
    
    // Needed for instanceof to work properly with custom errors
    Object.setPrototypeOf(this, AuthApiError.prototype);
  }

  /**
   * Check if this error is related to network issues
   */
  isNetworkError(): boolean {
    const message = this.message.toLowerCase();
    return message.includes('network') || 
           message.includes('connection') || 
           message.includes('offline') ||
           this.code === 'network_error';
  }

  /**
   * Check if this error is related to timeouts
   */
  isTimeoutError(): boolean {
    const message = this.message.toLowerCase();
    return message.includes('timeout') || 
           message.includes('timed out') ||
           this.code === 'timeout_error';
  }

  /**
   * Check if this error is likely to be resolved by retrying
   */
  isRetryable(): boolean {
    return this.isNetworkError() || this.isTimeoutError();
  }

  /**
   * Create an AuthApiError from any caught error
   */
  static from(error: any): AuthApiError {
    if (error instanceof AuthApiError) {
      return error;
    }

    const message = error?.message || 'Unknown error';
    const code = error?.code || 'unknown_error';
    const status = typeof error?.status === 'number' ? error.status : undefined;
    
    return new AuthApiError(message, code, status, error);
  }
}

/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @param errorMessage Custom error message for timeout
 * @returns Promise result or throws if timeout occurs
 */
export const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs = API_TIMEOUTS.DEFAULT,
  errorMessage = 'Operation timed out'
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new AuthApiError(
        `${errorMessage} after ${timeoutMs}ms`, 
        'timeout_error'
      ));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
};

/**
 * Standardized retry logic with exponential backoff
 * @param operation Function that returns a promise to retry
 * @param options Retry options
 * @returns Promise result or throws if all retries fail
 */
export const withRetries = async <T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseTimeout?: number;
    retryableErrorTest?: (error: any) => boolean;
    onRetry?: (attempt: number, error: any, nextRetryMs: number) => void;
  } = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    baseTimeout = API_TIMEOUTS.DEFAULT,
    retryableErrorTest,
    onRetry
  } = options;

  let attempts = 0;
  let lastError: any = null;
  
  while (attempts < maxAttempts) {
    try {
      // Increase timeout with each retry
      const currentTimeout = baseTimeout + (attempts * 1000);
      logWithTimestamp(`[apiUtils:withRetries] Attempt ${attempts + 1}/${maxAttempts} with timeout ${currentTimeout}ms`);
      
      return await withTimeout(
        operation(), 
        currentTimeout,
        `Operation timed out on attempt ${attempts + 1}/${maxAttempts}`
      );
    } catch (error) {
      lastError = error;
      const authError = AuthApiError.from(error);
      
      // Check if we should retry based on the error
      const shouldRetry = retryableErrorTest 
        ? retryableErrorTest(authError)
        : authError.isRetryable();
      
      if (!shouldRetry) {
        logWithTimestamp(`[apiUtils:withRetries] Non-retryable error on attempt ${attempts + 1}/${maxAttempts}:`, authError);
        throw authError;
      }
      
      // If this was the last attempt, throw the error
      if (++attempts >= maxAttempts) {
        logWithTimestamp(`[apiUtils:withRetries] Max attempts (${maxAttempts}) reached, failing`);
        throw authError;
      }
      
      // Calculate backoff for next retry
      const backoffMs = Math.min(
        500 * Math.pow(2, attempts), // Exponential backoff starting at 500ms
        10000 // Maximum 10 second delay
      );
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempts, authError, backoffMs);
      }
      
      logWithTimestamp(`[apiUtils:withRetries] Waiting ${backoffMs}ms before next attempt`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
  
  // Should never get here, but TypeScript needs a return
  throw AuthApiError.from(lastError || new Error('Unknown error in retry logic'));
}; 