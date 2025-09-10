interface TreeNodeRaw {
	id: string | number;
	parentId?: string | number | null;
	[key: string]: any; // 其它业务字段
}

type TreeNode<T = any> = T & {
	children?: TreeNode<T>[];
};

/**
 * 通用的：将平铺的树形数据（带 parentId）转换为树形结构
 * @param items 平铺的数据列表
 * @param idKey 节点唯一标识字段名，默认为 'id'
 * @param parentIdKey 父节点标识字段名，默认为 'parentId'
 * @param childrenKey 子节点字段名，默认为 'children'
 * @returns 树形结构数组（根节点数组，即 parentId 为 null/undefined 的节点）
 */
export function buildTree<T extends TreeNodeRaw>(
	items: T[],
	idKey: keyof T | string = "id",
	parentIdKey: keyof T | string = "parentId",
	childrenKey: keyof T | string = "children",
): Array<TreeNode<T>> {
	const itemMap = new Map<string | number, T>();
	const roots: Array<TreeNode<T>> = [];

	// 1. 先将所有节点存入 Map，方便通过 id 查找
	for (const item of items) {
		const id = item[idKey];
		itemMap.set(id, item);
	}
	// 2. 遍历所有节点，构建树
	for (const item of items) {
		const parentId = item[parentIdKey];
		if (parentId === null || parentId === undefined || parentId === "") {
			roots.push(item);
		} else {
			// 如果有 parentId，找到父节点，并将当前节点添加到父节点的 children 中
			const parent = itemMap.get(parentId);
			if (parent) {
				const parentWithChildren = parent as any;

				if (!parentWithChildren[childrenKey]) {
					parentWithChildren[childrenKey] = [];
				}
				(parentWithChildren[childrenKey] as TreeNode<T>[]).push({
					...item,
				} as TreeNode<T>);
			}
		}
	}
	return roots;
}

/**
 * 通用的：将树形结构（带 children）平铺为一维数组（递归所有节点）
 * @param tree 树形结构数组（每个节点可能有 children）
 * @param childrenKey 子节点字段名，默认为 'children'
 * @returns 平铺的节点数组（所有节点，包括子节点，递归展开）
 */
export function flattenTree<T extends { children?: T[] }>(
	tree: T[],
	childrenKey: keyof T = "children",
): Omit<T, typeof childrenKey>[] {
	let result: T[] = [];
	for (const node of tree) {
		result.push(node);

		// 递归处理子节点
		const children = node[childrenKey] as T[] | undefined;

		if (children && children.length > 0) {
			const flattenedChildren = flattenTree(
				children,
				childrenKey,
			) as unknown as T[];
			result = result.concat(flattenedChildren);
		}
	}
	// 剔除 children 字段，返回纯净的扁平列表
	return result.map(({ [childrenKey]: _, ...rest }) => rest);
}
