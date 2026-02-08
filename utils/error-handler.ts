// utils/error-handler.ts
/**
 * Helper function to safely extract error messages
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }
    
    // Try to stringify the object
    try {
      return JSON.stringify(error);
    } catch {
      return 'Terjadi kesalahan yang tidak diketahui';
    }
  }
  
  return 'Terjadi kesalahan yang tidak diketahui';
}

/**
 * Check if error is a Supabase auth error
 */
export function isAuthError(error: unknown): boolean {
  return error instanceof Object && 
         error !== null && 
         'message' in error && 
         typeof error.message === 'string' &&
         error.message.toLowerCase().includes('auth');
}