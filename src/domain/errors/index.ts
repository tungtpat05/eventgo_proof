/**
 * Base Application Error
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
  constructor(message: string, public readonly errors?: Record<string, string[]>) {
    super(message);
  }
}

export class AuthenticationError extends AppError {
  readonly statusCode = 401;
  constructor(message = 'Chưa xác thực người dùng. Vui lòng đăng nhập lại.') {
    super(message);
  }
}

export class AuthorizationError extends AppError {
  readonly statusCode = 403;
  constructor(message = 'Bạn không có quyền thực hiện hành động này.') {
    super(message);
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  constructor(entityName = 'Dữ liệu', id?: string) {
    super(`${entityName}${id ? ` với mã [${id}]` : ''} không tồn tại.`);
  }
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  constructor(message: string) {
    super(message);
  }
}

export class BusinessRuleError extends AppError {
  readonly statusCode = 422;
  constructor(message: string) {
    super(message);
  }
}

export class InfrastructureError extends AppError {
  readonly statusCode = 500;
  constructor(message = 'Lỗi hệ thống hoặc dịch vụ bên ngoài.') {
    super(message);
  }
}
