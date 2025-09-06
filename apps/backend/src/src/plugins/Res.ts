// Elysia + Drizzle 统一响应格式工具文件

import { type TSchema, t } from "elysia";

// 错误码枚举
export enum ErrorCode {
	// 通用错误 1000-1999
	SUCCESS = 200,
	INTERNAL_ERROR = 1000,
	INVALID_PARAMS = 1001,
	UNAUTHORIZED = 1002,
	FORBIDDEN = 1003,
	NOT_FOUND = 1004,
	METHOD_NOT_ALLOWED = 1005,
	TOO_MANY_REQUESTS = 1006,

	// 用户相关错误 2000-2999
	USER_NOT_FOUND = 2000,
	USER_ALREADY_EXISTS = 2001,
	INVALID_PASSWORD = 2002,
	ACCOUNT_DISABLED = 2003,
	EMAIL_NOT_VERIFIED = 2004,

	// 业务逻辑错误 3000-3999
	INSUFFICIENT_BALANCE = 3000,
	ORDER_NOT_FOUND = 3001,
	PRODUCT_OUT_OF_STOCK = 3002,
	INVALID_OPERATION = 3003,

	// 数据库错误 4000-4999
	DATABASE_ERROR = 4000,
	DUPLICATE_ENTRY = 4001,
	FOREIGN_KEY_CONSTRAINT = 4002,

	// 外部服务错误 5000-5999
	THIRD_PARTY_SERVICE_ERROR = 5000,
	PAYMENT_GATEWAY_ERROR = 5001,
	SMS_SERVICE_ERROR = 5002,
	EMAIL_SERVICE_ERROR = 5003,
}

// 错误消息映射
export const ErrorMessages: Record<ErrorCode, string> = {
	[ErrorCode.SUCCESS]: "操作成功",
	[ErrorCode.INTERNAL_ERROR]: "服务器内部错误",
	[ErrorCode.INVALID_PARAMS]: "参数错误",
	[ErrorCode.UNAUTHORIZED]: "未授权访问",
	[ErrorCode.FORBIDDEN]: "禁止访问",
	[ErrorCode.NOT_FOUND]: "资源不存在",
	[ErrorCode.METHOD_NOT_ALLOWED]: "请求方法不允许",
	[ErrorCode.TOO_MANY_REQUESTS]: "请求过于频繁",

	[ErrorCode.USER_NOT_FOUND]: "用户不存在",
	[ErrorCode.USER_ALREADY_EXISTS]: "用户已存在",
	[ErrorCode.INVALID_PASSWORD]: "密码错误",
	[ErrorCode.ACCOUNT_DISABLED]: "账户已被禁用",
	[ErrorCode.EMAIL_NOT_VERIFIED]: "邮箱未验证",

	[ErrorCode.INSUFFICIENT_BALANCE]: "余额不足",
	[ErrorCode.ORDER_NOT_FOUND]: "订单不存在",
	[ErrorCode.PRODUCT_OUT_OF_STOCK]: "商品库存不足",
	[ErrorCode.INVALID_OPERATION]: "无效操作",

	[ErrorCode.DATABASE_ERROR]: "数据库错误",
	[ErrorCode.DUPLICATE_ENTRY]: "数据重复",
	[ErrorCode.FOREIGN_KEY_CONSTRAINT]: "外键约束错误",

	[ErrorCode.THIRD_PARTY_SERVICE_ERROR]: "第三方服务错误",
	[ErrorCode.PAYMENT_GATEWAY_ERROR]: "支付网关错误",
	[ErrorCode.SMS_SERVICE_ERROR]: "短信服务错误",
	[ErrorCode.EMAIL_SERVICE_ERROR]: "邮件服务错误",
};

// 快捷错误响应函数
export const ErrorResponses = {
	// 通用错误
	internalError: (data?: any) =>
		errorRes(ErrorCode.INTERNAL_ERROR, undefined, data),
	invalidParams: (message?: string, data?: any) =>
		errorRes(ErrorCode.INVALID_PARAMS, message, data),
	unauthorized: (message?: string, data?: any) =>
		errorRes(ErrorCode.UNAUTHORIZED, message, data),
	forbidden: (message?: string, data?: any) =>
		errorRes(ErrorCode.FORBIDDEN, message, data),
	notFound: (message?: string, data?: any) =>
		errorRes(ErrorCode.NOT_FOUND, message, data),
	tooManyRequests: (message?: string, data?: any) =>
		errorRes(ErrorCode.TOO_MANY_REQUESTS, message, data),

	// 用户相关错误
	userNotFound: (data?: any) =>
		errorRes(ErrorCode.USER_NOT_FOUND, undefined, data),
	userAlreadyExists: (data?: any) =>
		errorRes(ErrorCode.USER_ALREADY_EXISTS, undefined, data),
	invalidPassword: (data?: any) =>
		errorRes(ErrorCode.INVALID_PASSWORD, undefined, data),
	accountDisabled: (data?: any) =>
		errorRes(ErrorCode.ACCOUNT_DISABLED, undefined, data),
	emailNotVerified: (data?: any) =>
		errorRes(ErrorCode.EMAIL_NOT_VERIFIED, undefined, data),

	// 业务逻辑错误
	insufficientBalance: (data?: any) =>
		errorRes(ErrorCode.INSUFFICIENT_BALANCE, undefined, data),
	orderNotFound: (data?: any) =>
		errorRes(ErrorCode.ORDER_NOT_FOUND, undefined, data),
	productOutOfStock: (data?: any) =>
		errorRes(ErrorCode.PRODUCT_OUT_OF_STOCK, undefined, data),
	invalidOperation: (message?: string, data?: any) =>
		errorRes(ErrorCode.INVALID_OPERATION, message, data),

	// 数据库错误
	databaseError: (data?: any) =>
		errorRes(ErrorCode.DATABASE_ERROR, undefined, data),
	duplicateEntry: (message?: string, data?: any) =>
		errorRes(ErrorCode.DUPLICATE_ENTRY, message, data),
	foreignKeyConstraint: (data?: any) =>
		errorRes(ErrorCode.FOREIGN_KEY_CONSTRAINT, undefined, data),

	// 外部服务错误
	thirdPartyServiceError: (data?: any) =>
		errorRes(ErrorCode.THIRD_PARTY_SERVICE_ERROR, undefined, data),
	paymentGatewayError: (data?: any) =>
		errorRes(ErrorCode.PAYMENT_GATEWAY_ERROR, undefined, data),
	smsServiceError: (data?: any) =>
		errorRes(ErrorCode.SMS_SERVICE_ERROR, undefined, data),
	emailServiceError: (data?: any) =>
		errorRes(ErrorCode.EMAIL_SERVICE_ERROR, undefined, data),
};

export const Meta = t.Object({
	total: t.Number(),
	page: t.Number(),
	pageSize: t.Number(),
	totalPages: t.Number(),
});

/**
 * 工厂函数 构建通用返回类型
 * @param dataSchema 数据类型
 * @returns
 */
export const commonResSchema = <T extends TSchema>(dataSchema: T) => {
	return t.Object({
		code: t.Number(),
		message: t.String(),
		data: dataSchema,
	});
};

export const pageResSchema = <T extends TSchema>(dataSchema: T) => {
	return t.Object({
		code: t.Number(),
		message: t.String(),
		data: t.Object({
			items: t.MaybeEmpty(t.Array(dataSchema)),
			meta: Meta,
		}),
	});
};

// 成功响应函数
export function commonRes<T>(
	data: T,
	code = 200,
	message = "操作成功",
): {
	code: number;
	message: string;
	data: T;
} {
	return {
		code,
		message,
		data,
	};
}

// 错误响应函数 - 使用错误码枚举
export function errorRes(
	errorCode: ErrorCode = ErrorCode.INTERNAL_ERROR,
	customMessage?: string,
	data?: any,
) {
	return {
		code: errorCode,
		message: customMessage || ErrorMessages[errorCode],
		data,
	};
}

// 分页响应函数
export function pageRes<T>(
	data: T[],
	total: number,
	page = 1,
	pageSize = 10,
	message = "获取成功",
) {
	return commonRes(
		{
			items: data,
			meta: {
				total,
				page,
				pageSize,
				totalPages: Math.ceil(total / pageSize),
			},
		},
		200,
		message,
	);
}
