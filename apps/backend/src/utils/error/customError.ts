export class CustomeError extends Error {
	status = 500;
	resType: "page" | "com" = "com";

	constructor(
		/** 错误信息 */
		public message: string,
		/** HTTP 状态码 */
		status?: number,
		/** 返回类型 */
		resType?: "page" | "com",
	) {
		super(message);
		this.status = status || 500;
		this.resType = resType || "com";
	}

	toComResponse() {
		return Response.json(
			{
				status: this.status,
				data: null,
				message: this.message,
			},
			{ status: this.status },
		);
	}

	toPageResponse() {
		return Response.json(
			{
				status: this.status,
				message: this.message,
				data: {
					items: [],
					meta: {
						total: 0,
						page: 1,
						limit: 10,
						totalPage: 0,
					},
				},
			},
			{ status: this.status },
		);
	}
}

// 数据库相关错误
export class DatabaseError extends CustomeError {
	constructor(message: string = "数据库操作失败", resType?: "page" | "com") {
		super(message, 500, resType);
	}
}

// 验证相关错误
export class ValidationError extends CustomeError {
	constructor(message: string = "数据验证失败", resType?: "page" | "com") {
		super(message, 400, resType);
	}
}

// 记录不存在错误
export class NotFoundError extends CustomeError {
	constructor(message: string = "记录不存在", resType?: "page" | "com") {
		super(message, 404, resType);
	}
}

// 服务器内部错误
export class InternalServerError extends CustomeError {
	constructor(message: string = "服务器内部错误", resType?: "page" | "com") {
		super(message, 500, resType);
	}
}

// 权限相关错误
export class AuthorizationError extends CustomeError {
	constructor(message: string = "权限不足", resType?: "page" | "com") {
		super(message, 403, resType);
	}
}

// 认证相关错误
export class AuthenticationError extends CustomeError {
	constructor(message: string = "认证失败", resType?: "page" | "com") {
		super(message, 401, resType);
	}
}

// 业务逻辑错误
export class BusinessError extends CustomeError {
	constructor(message: string = "业务逻辑错误", resType?: "page" | "com") {
		super(message, 400, resType);
	}
}

// 分页相关错误
export class PaginationError extends CustomeError {
	constructor(message: string = "分页参数错误", resType?: "page" | "com") {
		super(message, 400, resType);
	}
}

// 文件上传错误
export class UploadError extends CustomeError {
	constructor(message: string = "文件上传失败", resType?: "page" | "com") {
		super(message, 400, resType);
	}
}

// 重复数据错误
export class DuplicateError extends CustomeError {
	constructor(message: string = "数据已存在", resType?: "page" | "com") {
		super(message, 409, resType);
	}
}

// 请求过多错误
export class TooManyRequestsError extends CustomeError {
	constructor(message: string = "请求过于频繁", resType?: "page" | "com") {
		super(message, 429, resType);
	}
}

// 服务不可用错误
export class ServiceUnavailableError extends CustomeError {
	constructor(message: string = "服务暂时不可用", resType?: "page" | "com") {
		super(message, 503, resType);
	}
}

/**
 * 处理数据库错误 - 转换为自定义错误类
 */
export function handleDatabaseError(error: any) {
	const errorCode = error?.code;
	const errorMessage = error?.message;

	switch (errorCode) {
		case "23505": // 唯一约束冲突
			return new DuplicateError("数据已存在，请勿重复提交");

		case "23503": // 外键约束冲突
			return new ValidationError("关联数据不存在，请检查数据完整性");

		case "23502": // 非空约束冲突
			return new ValidationError("必填字段不能为空");

		case "23514": // 检查约束冲突
			return new ValidationError("数据格式不正确");

		case "08006": // 连接失败
			return new ServiceUnavailableError("数据库连接失败，请稍后重试");

		case "28P01": // 认证失败
			return new InternalServerError("数据库认证失败");

		case "40P01": // 死锁
			return new DatabaseError("数据库死锁，请重试");

		case "57014": // 超时
			return new DatabaseError("数据库操作超时");

		default:
			return new DatabaseError(errorMessage || "数据库操作失败");
	}
}
