/**
 * Unified error formatting and extraction service for Tohfa Mobile.
 *
 * Translates ApiError, NetworkError, Problem+JSON, and Zod errors
 * into clean, user-friendly, and actionable error messages.
 */
import { ApiError, NetworkError } from './client';

/**
 * Extracts a human-readable, specific error message from an unknown error.
 * Prioritizes field validation errors, specific problem details, and network issues
 * over generic fallback messages.
 */
export function formatErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (err instanceof ApiError) {
    const { problem } = err;

    // 1. If the API returned specific field-level validation errors (e.g. from Zod)
    if (problem.errors && Object.keys(problem.errors).length > 0) {
      const messages = Object.entries(problem.errors).map(([field, fieldMsgs]) => {
        const cleanField = field.replace(/^(body|query|params)\./, '');
        const formattedField = cleanField
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
        return `${formattedField}: ${fieldMsgs.join(', ')}`;
      });
      return messages.join('\n');
    }

    // 2. Specialized messages by machine ErrorCode
    switch (problem.code) {
      case 'UNAUTHENTICATED':
        return 'Invalid mobile number or password. Please check your credentials.';
      case 'CONFLICT':
        return problem.detail || 'An active application or account already exists for this mobile number.';
      case 'OTP_INVALID':
        return 'The verification code entered is incorrect or has expired.';
      case 'OTP_EXPIRED':
        return 'The verification code has expired. Please request a new one.';
      case 'OTP_LOCKED':
        return 'Too many failed verification attempts. Please wait before trying again.';
      case 'OTP_RESEND_TOO_SOON':
        return problem.detail || 'Please wait before requesting another code.';
      case 'CERT_EXPIRED':
        return 'Your certification has expired. Please renew it to continue.';
      case 'NOT_FOUND':
        return problem.detail || 'The requested resource was not found.';
      case 'VALIDATION_FAILED':
        return problem.detail || 'Please check the information entered and try again.';
      default:
        break;
    }

    // 3. Fall back to problem detail or title if available
    if (problem.detail && problem.detail.trim().length > 0) {
      return problem.detail;
    }
    if (problem.title && problem.title.trim().length > 0) {
      return problem.title;
    }
  }

  if (err instanceof NetworkError) {
    return 'Cannot reach the server. Please check your internet connection and try again.';
  }

  if (err instanceof Error) {
    if (err.message.includes('Network request failed')) {
      return 'Network connection failed. Please ensure the server is running and accessible.';
    }
    return err.message;
  }

  if (typeof err === 'string' && err.trim().length > 0) {
    return err;
  }

  return fallback;
}

/**
 * Extracts a map of field name -> error message from an ApiError,
 * stripping prefixes like 'body.' or 'query.' for direct binding to form inputs.
 */
export function extractFieldErrors(err: unknown): Record<string, string> {
  const result: Record<string, string> = {};

  if (err instanceof ApiError && err.problem.errors) {
    for (const [key, msgs] of Object.entries(err.problem.errors)) {
      const cleanKey = key.replace(/^(body|query|params)\./, '');
      if (msgs && msgs.length > 0 && msgs[0]) {
        result[cleanKey] = msgs[0];
      }
    }
  }

  return result;
}
