import { ZodError } from 'zod';
import { AppError, ValidationError } from '@/domain/errors';

export interface ActionErrorResult {
  error: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Normalizes any error thrown during Server Action execution into user-friendly messages.
 * Prevents raw PostgreSQL RLS errors or stringified Zod JSON from being exposed to the user.
 */
export function formatActionError(
  err: unknown,
  defaultMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại.'
): ActionErrorResult {
  if (err && typeof err === 'object' && 'digest' in err) {
    // Next.js redirect throw - must rethrow
    throw err;
  }

  // Direct ZodError instance
  if (err instanceof ZodError) {
    const flattened = err.flatten();
    const fieldErrors: Record<string, string[]> = {};
    for (const [key, val] of Object.entries(flattened.fieldErrors)) {
      if (Array.isArray(val) && val.length > 0) {
        fieldErrors[key] = val;
      }
    }

    const firstIssue = err.issues[0]?.message;
    return {
      error: firstIssue || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra các trường thông tin.',
      fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
    };
  }

  // App-specific ValidationError
  if (err instanceof ValidationError) {
    return {
      error: err.message,
      fieldErrors: err.errors,
    };
  }

  // App-specific domain errors (AuthorizationError, NotFoundError, etc.)
  if (err instanceof AppError) {
    return {
      error: err.message,
    };
  }

  if (err instanceof Error) {
    const msg = err.message;

    // Check for PostgreSQL Row-Level Security policy violations
    if (msg.includes('violates row-level security policy') || msg.includes('row-level security')) {
      return {
        error:
          'Bạn không có quyền thực hiện thao tác này trên dữ liệu đã chọn (chỉ Quản lý chiến dịch mới có quyền), hoặc phiên đăng nhập đã hết hạn. Vui lòng kiểm tra lại quyền hoặc đăng nhập lại.',
      };
    }

    // Check for stringified Zod JSON errors (e.g. `[ { "origin": "string", "code": "too_small", ... } ]`)
    if (msg.trim().startsWith('[') && msg.includes('"message":')) {
      try {
        const parsed = JSON.parse(msg);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const fieldErrors: Record<string, string[]> = {};
          for (const item of parsed) {
            const key = Array.isArray(item.path) && item.path.length > 0 ? String(item.path[0]) : 'general';
            if (!fieldErrors[key]) fieldErrors[key] = [];
            if (item.message) fieldErrors[key].push(item.message);
          }
          const firstMessage = parsed[0]?.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
          return {
            error: firstMessage,
            fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
          };
        }
      } catch {
        // Fall back to general message
      }
    }

    return {
      error: msg,
    };
  }

  return {
    error: defaultMessage,
  };
}
