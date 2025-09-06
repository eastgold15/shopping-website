/**
 * 通用 API 调用包装器，自动处理错误提示
 * @param apiPromise API 调用的 Promise
 * @returns 如果成功返回 response.data，失败返回 null 并显示错误消息
 */
export async function handleApiRes<T>(
	apiPromise: Promise<{
		status: number;
		message?: string;
		data?: T;
		[key: string]: any;
	}>,
): Promise<T | null> {
	try {
		const response = await apiPromise;
		console.log("response", response);
		if (response.status !== 200) {
			throw new Error(response.message || "请求失败");
		}

		return response.data ?? null;
	} catch (error) {
		throw error;
	}
}
