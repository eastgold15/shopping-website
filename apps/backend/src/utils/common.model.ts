import { t } from "elysia";

// 公共查询列表类型
export const UnoQuery = t.Object({
	search: t.Optional(t.String()),
	page: t.Optional(t.Number()),
	pageSize: t.Optional(t.Number()),
	sortBy: t.Optional(t.String()),
	sortOrder: t.Optional(t.String()),
});
