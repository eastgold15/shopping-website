/**
 * 通用 API 调用包装器，自动处理错误提示
 * @param apiPromise API 调用的 Promise
 * @param showToast 是否显示错误提示（默认为 true）
 * @returns 如果成功返回 response.data，失败抛出错误并显示错误消息
 */

/**
 * 显示错误提示的辅助函数
 */
function _showErrorToast(message: string) {
	// 动态导入 toast 以避免循环依赖
	import("primevue/usetoast")
		.then(({ useToast }) => {
			const toast = useToast();
			toast.add({
				severity: "error",
				summary: "错误",
				detail: message,
				life: 3000,
			});
		})
		.catch(() => {
			console.error("Toast 通知失败:", message);
		});
}

/**
 * 更智能的默认值生成器（推荐使用）
 */
export function smartDefaultValue<T>(): T {
	// 处理基本类型
	const type = typeof {} as T;

	if (type === "string") return "" as unknown as T;
	if (type === "number") return 0 as unknown as T;
	if (type === "boolean") return false as unknown as T;

	// 处理数组
	if (Array.isArray({} as T)) return [] as unknown as T;

	// 处理对象 - 递归创建默认值
	if (type === "object") {
		// 这是一个简化版本，实际使用时可能需要更复杂的逻辑
		return {} as T;
	}

	return null as unknown as T;
}
