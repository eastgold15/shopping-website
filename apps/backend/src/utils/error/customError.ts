// 基类 CustomeError
export class CustomeError extends Error {
  status = 500;
  originalError?: any;

  constructor(
    message: string,
    status?: number,
    originalError?: any
  ) {
    super(message);
    this.status = status || 500;
    this.originalError = originalError;

    // 修复 TypeScript 继承原型链问题
    Object.setPrototypeOf(this, new.target.prototype);

    // 可选：继承原始错误的 stack
    if (originalError?.stack) {
      this.stack = originalError.stack;
    }
  }

  /**
   * 统一返回标准 JSON 响应格式
   * 格式：{ status, message, data }
   */
  toResponse() {
    return Response.json(
      {
        status: this.status,
        message: this.message,
        data: null,
        error: this.originalError
      },
      { status: this.status }
    );
  }
}
export class DatabaseError extends CustomeError {
  constructor(message: string = "数据库操作失败", originalError?: any) {
    super(message, 500, originalError);
  }
}

export class ValidationError extends CustomeError {
  constructor(message: string = "数据验证失败", originalError?: any) {
    super(message, 400, originalError);
  }
}

export class NotFoundError extends CustomeError {
  constructor(message: string = "记录不存在", originalError?: any) {
    super(message, 404, originalError);
  }
}

export class InternalServerError extends CustomeError {
  constructor(message: string = "服务器内部错误", originalError?: any) {
    super(message, 500, originalError);
  }
}

export class AuthorizationError extends CustomeError {
  constructor(message: string = "权限不足", originalError?: any) {
    super(message, 403, originalError);
  }
}

export class AuthenticationError extends CustomeError {
  constructor(message: string = "认证失败", originalError?: any) {
    super(message, 401, originalError);
  }
}

export class BusinessError extends CustomeError {
  constructor(message: string = "业务逻辑错误", originalError?: any) {
    super(message, 400, originalError);
  }
}

export class DuplicateError extends CustomeError {
  constructor(message: string = "数据已存在", originalError?: any) {
    super(message, 409, originalError);
  }
}

export class ServiceUnavailableError extends CustomeError {
  constructor(message: string = "服务暂时不可用", originalError?: any) {
    super(message, 503, originalError);
  }
}

// 其他错误类按需保留...

/**
 * 处理数据库错误 - 转换为自定义错误类
 */
export function handleDatabaseError(error: any) {
  const errorCode = error?.code;
  const errorMessage = error?.message;

  switch (errorCode) {
    case "23505":
      return new DuplicateError("数据已存在，请勿重复提交", error);
    case "23503":
      return new ValidationError("关联数据不存在，请检查数据完整性", error);
    case "23502":
      return new ValidationError("必填字段不能为空", error);
    case "23514":
      return new ValidationError("数据格式不正确", error);
    case "08006":
      return new ServiceUnavailableError("数据库连接失败，请稍后重试", error);
    case "28P01":
      return new InternalServerError("数据库认证失败", error);
    case "40P01":
      return new DatabaseError("数据库死锁，请重试", error);
    case "57014":
      return new DatabaseError("数据库操作超时", error);
    default:
      return new DatabaseError(errorMessage || "数据库操作失败", error);
  }
}