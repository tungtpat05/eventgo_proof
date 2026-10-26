import { ZodError } from 'zod';
import { AppError, ValidationError } from '@/domain/errors';

export interface ActionErrorResult {
  success: false;
  errorCode: string;
  params?: Record<string, string | number>;
  fieldErrors?: Record<string, string[]>;
  error: string;
}

/**
 * Normalizes any error thrown during Server Action execution into a standardized machine-readable error contract.
 * Remains strictly synchronous and decoupled from next-intl.
 */
export function formatActionError(
  err: unknown,
  defaultCodeOrMessage: string = 'ERR_UNKNOWN',
  fallbackMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại.'
): ActionErrorResult {
  if (err && typeof err === 'object' && 'digest' in err) {
    // Next.js redirect throw - must rethrow
    throw err;
  }

  const isCustomCode = defaultCodeOrMessage.startsWith('ERR_') || defaultCodeOrMessage.startsWith('VAL_');
  const defaultCode = isCustomCode ? defaultCodeOrMessage : 'ERR_UNKNOWN';
  const defaultFallback = isCustomCode ? fallbackMessage : defaultCodeOrMessage;

  // Direct ZodError instance
  if (err instanceof ZodError) {
    const flattened = err.flatten();
    const fieldErrors: Record<string, string[]> = {};
    for (const [key, val] of Object.entries(flattened.fieldErrors)) {
      if (Array.isArray(val) && val.length > 0) {
        fieldErrors[key] = val;
      }
    }

    const firstIssue = err.issues[0];
    const errorCode = firstIssue ? `VAL_${firstIssue.code.toUpperCase()}` : 'ERR_INVALID_INPUT';
    return {
      success: false,
      errorCode,
      fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
      error: firstIssue?.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra các trường thông tin.',
    };
  }

  // App-specific ValidationError
  if (err instanceof ValidationError) {
    return {
      success: false,
      errorCode: 'ERR_INVALID_INPUT',
      fieldErrors: err.errors,
      error: err.message,
    };
  }

  // App-specific domain errors (AuthorizationError, NotFoundError, etc.)
  if (err instanceof AppError) {
    let errorCode = 'ERR_UNKNOWN';
    if (
      err.name === 'AuthorizationError' ||
      err.message.toLowerCase().includes('quyền') ||
      err.message.toLowerCase().includes('unauthorized')
    ) {
      errorCode = 'ERR_FORBIDDEN';
    } else if (err.name === 'NotFoundError' || err.message.toLowerCase().includes('không tìm thấy')) {
      errorCode = 'ERR_NOT_FOUND';
    }
    return {
      success: false,
      errorCode,
      error: err.message,
    };
  }

  if (err instanceof Error) {
    const msg = err.message;

    // Check for PostgreSQL Row-Level Security policy violations
    if (msg.includes('violates row-level security policy') || msg.includes('row-level security')) {
      return {
        success: false,
        errorCode: 'ERR_RLS_VIOLATION',
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
          const firstItem = parsed[0];
          const firstMessage = firstItem?.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
          const errorCode = firstItem?.code ? `VAL_${String(firstItem.code).toUpperCase()}` : 'ERR_INVALID_INPUT';
          return {
            success: false,
            errorCode,
            fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
            error: firstMessage,
          };
        }
      } catch {
        // Fall back to general message
      }
    }

    return {
      success: false,
      errorCode: defaultCode,
      error: msg,
    };
  }

  return {
    success: false,
    errorCode: defaultCode,
    error: defaultFallback,
  };
}
