
export class CustomError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
  ) {
    super(message);
    this.name = this.constructor.name; // 确保 Error.name 正确
  }

  toResponse() {
    return Response.json(
      {
        code: this.status,
        message: this.message,
        data: null,
      },
      { status: this.status },
    );
  }
}

// ========== 各种子错误类 ==========

export class DatabaseError extends CustomError {
  constructor(message: string = "数据库操作失败") {
    super(message, 500);
  }
}

export class ValidationError extends CustomError {
  constructor(message: string = "请求数据格式错误") { // 更准确的默认消息
    super(message, 400);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = "请求的资源不存在") {
    super(message, 404);
  }
}

export class InternalServerError extends CustomError {
  constructor(message: string = "服务器内部错误") {
    super(message, 500);
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = "权限不足，无法访问") {
    super(message, 403);
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = "请先登录") {
    super(message, 401);
  }
}

export class BusinessError extends CustomError {
  constructor(message: string = "业务规则校验失败") {
    super(message, 400);
  }
}

export class PaginationError extends CustomError {
  constructor(message: string = "分页参数无效") {
    super(message, 400);
  }
}

export class UploadError extends CustomError {
  constructor(message: string = "文件上传失败") {
    super(message, 400);
  }
}

export class DuplicateError extends CustomError {
  constructor(message: string = "数据已存在，请勿重复提交") {
    super(message, 409);
  }
}

export class TooManyRequestsError extends CustomError {
  constructor(message: string = "请求过于频繁，请稍后重试") {
    super(message, 429);
  }
}

export class ServiceUnavailableError extends CustomError {
  constructor(message: string = "服务暂时不可用，请稍后重试") {
    super(message, 503);
  }
}




/**
 * 通用数据库错误处理器（增强版）
 * - 自动提取字段、值、约束名、表名等关键信息
 * - 支持丰富 PostgreSQL 错误码
 * - 抛出语义化自定义错误类
 */
export function handleDatabaseError(error: any): never {
  // 开发环境可保留，生产环境建议移除或降级
  if (process.env.NODE_ENV === 'development') {
    console.log('🔵 数据库原始错误:', {
      code: error?.code,
      message: error?.message,
      detail: error?.detail,
      constraint: error?.constraint,
      table: error?.table,
      column: error?.column,
    });
  }

  const code = error?.code || '';
  const constraint = error?.constraint || '未知约束';
  const table = error?.table || '未知表';
  const detail = error?.detail || '';
  const message = error?.message || '数据库操作失败';
  const column = error?.column || '';

  switch (code) {
    case '23505': { // unique_violation
      const match = detail.match(/Key \(([^)]+)\)=\(([^)]+)\) already exists/);
      let msg = `违反唯一约束 "${constraint}"`;

      if (match) {
        const field = match[1];
        const value = match[2];
        msg = `字段 "${field}" 的值 "${value}" 已存在`;
      } else if (column) {
        msg = `字段 "${column}" 的值重复`;
      }

      throw new DuplicateError(msg);
    }

    case '23503': { // foreign_key_violation
      let msg = `外键约束失败: ${constraint}`;
      const fkMatch = detail.match(/Key \(([^)]+)\)=\(([^)]+)\) is not present in table "([^"]+)"/);
      if (fkMatch) {
        const field = fkMatch[1];
        const value = fkMatch[2];
        const refTable = fkMatch[3];
        msg = `关联表 "${refTable}" 中不存在 ${field} = "${value}"`;
      }
      throw new ValidationError(msg);
    }

    case '23502': // not_null_violation
      throw new ValidationError(`字段 "${column || '未知字段'}" 不能为空`);

    case '23514': // check_violation
      throw new ValidationError(`数据校验失败: ${message}`);

    case '22P02': // invalid_text_representation
      throw new ValidationError(`"${column || '输入值'}" 格式无效，请检查`);

    case '22001': // string_data_right_truncation
      throw new ValidationError('输入数据过长');

    case '22003': // numeric_value_out_of_range
      throw new ValidationError('数值超出允许范围');

    case '08006': // connection_exception
      throw new ServiceUnavailableError('数据库连接失败');

    case '28P01': // invalid_password
      throw new InternalServerError('数据库认证失败');

    case '53300': // too_many_connections
      throw new ServiceUnavailableError('数据库繁忙，请稍后重试');

    case '57014': // query_canceled
      throw new DatabaseError('操作超时');

    case '40P01': // deadlock_detected
      throw new DatabaseError('系统繁忙，请稍后重试');

    case '42501': // insufficient_privilege
      throw new AuthorizationError('权限不足');

    case 'P0002':
    case '02000':
      throw new NotFoundError('未找到相关数据');

    default:
      if (typeof code === 'string' && code.length >= 5) {
        console.log(process.env.NODE_ENV)
        const msg = process.env.NODE_ENV === 'development'
          ? `${message} (错误码: ${code})`
          : '操作失败，请稍后重试';
        throw new DatabaseError(msg);
      }

      console.error('⚠️ 未知数据库错误:', error);
      throw new DatabaseError('系统异常，请联系管理员');
  }
}