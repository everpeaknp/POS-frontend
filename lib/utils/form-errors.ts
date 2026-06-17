import { UseFormSetError, FieldValues, Path } from 'react-hook-form';

/**
 * Maps Django validation errors to react-hook-form errors
 * 
 * Django returns errors in the format:
 * {
 *   "field_name": ["Error message 1", "Error message 2"],
 *   "another_field": ["Error message"],
 *   "non_field_errors": ["General error"],
 *   "detail": "Authentication error"
 * }
 * 
 * This function maps those errors to react-hook-form's setError function
 * and optionally shows non-field errors as toast notifications.
 * 
 * @param errors - Django error response object
 * @param setError - react-hook-form setError function
 * @param toast - Optional toast function for non-field errors
 * 
 * @example
 * ```typescript
 * import { mapDjangoErrorsToForm } from '@/lib/utils/form-errors';
 * import toast from 'react-hot-toast';
 * 
 * try {
 *   await apiCall(data);
 * } catch (error: any) {
 *   if (error.response?.status === 400) {
 *     mapDjangoErrorsToForm(
 *       error.response.data,
 *       form.setError,
 *       toast.error
 *     );
 *   }
 * }
 * ```
 */
export function mapDjangoErrorsToForm<T extends FieldValues>(
  errors: Record<string, string[] | string>,
  setError: UseFormSetError<T>,
  toast?: (message: string) => void
): void {
  if (!errors || typeof errors !== 'object') {
    return;
  }

  Object.entries(errors).forEach(([field, messages]) => {
    // Handle non-field errors (detail, non_field_errors)
    if (field === 'detail' || field === 'non_field_errors') {
      const message = Array.isArray(messages) ? messages[0] : messages;
      if (toast && message) {
        toast(message);
      }
      return;
    }

    // Map field errors to form
    const message = Array.isArray(messages) ? messages[0] : messages;
    if (message) {
      setError(field as Path<T>, {
        type: 'manual',
        message
      });
    }
  });
}

/**
 * Extract a user-friendly error message from an Axios error
 * 
 * Handles various error response formats from Django:
 * - { detail: "Error message" }
 * - { non_field_errors: ["Error message"] }
 * - { field_name: ["Error message"] }
 * - Network errors
 * - Timeout errors
 * 
 * @param error - Axios error object
 * @returns User-friendly error message
 * 
 * @example
 * ```typescript
 * import { getErrorMessage } from '@/lib/utils/form-errors';
 * import toast from 'react-hot-toast';
 * 
 * try {
 *   await apiCall();
 * } catch (error: any) {
 *   toast.error(getErrorMessage(error));
 * }
 * ```
 */
export function getErrorMessage(error: any): string {
  // Network error
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.';
    }
    if (error.message === 'Network Error') {
      return 'Network error. Please check your connection.';
    }
    return error.message || 'An unexpected error occurred';
  }

  const data = error.response.data;

  // No data in response
  if (!data) {
    return `Error ${error.response.status}: ${error.response.statusText}`;
  }

  // Check for detail field (most common)
  if (data.detail) {
    return data.detail;
  }

  // Check for non_field_errors
  if (data.non_field_errors) {
    return Array.isArray(data.non_field_errors)
      ? data.non_field_errors[0]
      : data.non_field_errors;
  }

  // Get first field error
  const firstField = Object.keys(data)[0];
  if (firstField && data[firstField]) {
    const message = data[firstField];
    const errorText = Array.isArray(message) ? message[0] : message;
    return `${firstField}: ${errorText}`;
  }

  // Fallback
  return 'An error occurred. Please try again.';
}

/**
 * Check if an error is a validation error (400 Bad Request)
 * 
 * @param error - Axios error object
 * @returns True if error is a validation error
 * 
 * @example
 * ```typescript
 * import { isValidationError } from '@/lib/utils/form-errors';
 * 
 * try {
 *   await apiCall();
 * } catch (error: any) {
 *   if (isValidationError(error)) {
 *     // Handle validation errors
 *   } else {
 *     // Handle other errors
 *   }
 * }
 * ```
 */
export function isValidationError(error: any): boolean {
  return error.response?.status === 400;
}

/**
 * Check if an error is an authentication error (401 Unauthorized)
 * 
 * @param error - Axios error object
 * @returns True if error is an authentication error
 */
export function isAuthError(error: any): boolean {
  return error.response?.status === 401;
}

/**
 * Check if an error is a permission error (403 Forbidden)
 * 
 * @param error - Axios error object
 * @returns True if error is a permission error
 */
export function isPermissionError(error: any): boolean {
  return error.response?.status === 403;
}

/**
 * Check if an error is a not found error (404 Not Found)
 * 
 * @param error - Axios error object
 * @returns True if error is a not found error
 */
export function isNotFoundError(error: any): boolean {
  return error.response?.status === 404;
}

/**
 * Check if an error is a server error (500+)
 * 
 * @param error - Axios error object
 * @returns True if error is a server error
 */
export function isServerError(error: any): boolean {
  return error.response?.status >= 500;
}

/**
 * Get all error messages from a Django error response
 * Useful for displaying all errors at once
 * 
 * @param errors - Django error response object
 * @returns Array of error messages
 * 
 * @example
 * ```typescript
 * import { getAllErrorMessages } from '@/lib/utils/form-errors';
 * 
 * const errors = {
 *   name: ["This field is required"],
 *   email: ["Enter a valid email"],
 *   non_field_errors: ["Something went wrong"]
 * };
 * 
 * const messages = getAllErrorMessages(errors);
 * // ["name: This field is required", "email: Enter a valid email", "Something went wrong"]
 * ```
 */
export function getAllErrorMessages(
  errors: Record<string, string[] | string>
): string[] {
  if (!errors || typeof errors !== 'object') {
    return [];
  }

  const messages: string[] = [];

  Object.entries(errors).forEach(([field, fieldMessages]) => {
    const messageArray = Array.isArray(fieldMessages) ? fieldMessages : [fieldMessages];
    
    messageArray.forEach((message) => {
      if (field === 'detail' || field === 'non_field_errors') {
        messages.push(message);
      } else {
        messages.push(`${field}: ${message}`);
      }
    });
  });

  return messages;
}
