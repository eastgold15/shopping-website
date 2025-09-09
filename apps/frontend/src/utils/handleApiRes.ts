/**
 * 通用 API 调用包装器，自动处理错误提示
 * @param apiPromise API 调用的 Promise
 * @param showToast 是否显示错误提示（默认为 true）
 * @returns 如果成功返回 response.data，失败抛出错误并显示错误消息
 */
export async function handleApiRes<T>(
  apiPromise: Promise<{
    status: number;
    message?: string;
    data?: T;
    [key: string]: any;
  }>,
  showToast: boolean = true,
): Promise<T> {
  try {
    const { status, data, message } = await apiPromise;


    if (status !== 200) {
      const errorMessage = message || "请求失败";
      if (showToast) {
        showErrorToast(errorMessage);
      }
      throw new Error(errorMessage);
    }

    if (data === undefined) {
      throw new Error('响应数据为空');
    }
    return data;
  } catch (error) {
    if (showToast && error instanceof Error) {
      showErrorToast(error.message);
    }
    throw error;
  }
}

/**
 * 显示错误提示的辅助函数
 */
function showErrorToast(message: string) {
  // 动态导入 toast 以避免循环依赖
  import('primevue/usetoast').then(({ useToast }) => {
    const toast = useToast();
    toast.add({
      severity: 'error',
      summary: '错误',
      detail: message,
      life: 3000
    });
  }).catch(() => {
    console.error('Toast 通知失败:', message);
  });
}
