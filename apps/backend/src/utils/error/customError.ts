export class CustomeError extends Error {
	status = 10010;
	constructor(public message: string) {
		super(message);
	}

	toResponse() {
		return Response.json({
			success: false,
			error: this.message,
			code: this.status,
			data: null,
		});
	}
}

// 数据库相关错误
export class DatabaseError extends CustomeError {
	status = 20001;
	constructor(message: string = "数据库操作失败") {
		super(message);
	}
}

// 验证相关错误
export class ValidationError extends CustomeError {
	status = 20002;
	constructor(message: string = "数据验证失败") {
		super(message);
	}
}

// 记录不存在错误
export class NotFoundError extends CustomeError {
	status = 20003;
	constructor(message: string = "记录不存在") {
		super(message);
	}
}

// 权限相关错误
export class AuthorizationError extends CustomeError {
	status = 20004;
	constructor(message: string = "权限不足") {
		super(message);
	}
}

// 业务逻辑错误
export class BusinessError extends CustomeError {
	status = 20005;
	constructor(message: string = "业务逻辑错误") {
		super(message);
	}
}

// 分页相关错误
export class PaginationError extends CustomeError {
	status = 20006;
	constructor(message: string = "分页参数错误") {
		super(message);
	}
}

// 文件上传错误
export class UploadError extends CustomeError {
	status = 20007;
	constructor(message: string = "文件上传失败") {
		super(message);
	}
}

// 重复数据错误
export class DuplicateError extends CustomeError {
	status = 20008;
	constructor(message: string = "数据已存在") {
		super(message);
	}
}

// 删除旧的MyError2，使用新的错误类
export class MyError2 extends CustomeError {
	status = 10100;
	constructor(public message: string) {
		super(message);
	}
}

// z转为这种类型错误

/**
 * 处理数据库错误 - 转换为自定义错误类
 */
export function handleDatabaseError(error: any): CustomeError {
	// PostgreSQL错误代码
	const errorCode = error?.code;
	const errorMessage = error?.message;

	switch (errorCode) {
		case "23505": // 唯一约束冲突
			return new DuplicateError("数据已存在，请勿重复提交");

		case "23503": // 外键约束冲突
			return new ValidationError("外键约束冲突，请检查关联数据");

		case "23502": // 非空约束冲突
			return new ValidationError("必填字段不能为空");

		case "23514": // 检查约束冲突
			return new ValidationError("数据格式不正确");

		case "08006": // 连接失败
			return new DatabaseError("数据库连接失败");

		case "28P01": // 认证失败
			return new DatabaseError("数据库认证失败");

		case "40P01": // 死锁
			return new DatabaseError("数据库死锁，请重试");

		case "57014": // 超时
			return new DatabaseError("数据库操作超时");

		default:
			return new DatabaseError(errorMessage || "数据库操作失败");
	}
}
