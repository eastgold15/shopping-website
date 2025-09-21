import { paramIdZod } from "@backend/types";
import { NotFoundError } from "@backend/utils/error/customError";
import { commonRes } from "@backend/utils/Res";
import { Elysia } from "elysia";
import { partnersModel } from "../../db/models/partners.model";
import { PartnersService } from "./partners.service";
/**
 * 合作伙伴控制器
 * 处理合作伙伴相关的HTTP请求
 */
export const partnersController = new Elysia({
	prefix: "/partners",
	tags: ["Partners"],
})
	.model(partnersModel)
	.decorate("partnersService", new PartnersService())
	// 获取所有合作伙伴（前台用）
	.get(
		"/all",
		async ({ partnersService }) => {
			const partners = await partnersService.getActivePartnersList();
			return commonRes(partners, 200, "获取合作伙伴列表成功");
		},
		{
			detail: {
				tags: ["Partners"],
				summary: "获取合作伙伴列表",
				description: "获取启用的合作伙伴列表，按排序权重排序",
			},
		},
	)
	// 获取所有合作伙伴（管理后台用）
	.get(
		"/list",
		async ({ query, partnersService }) => {
			const result = await partnersService.getPartnersList(query);
			return commonRes(result, 200, "获取合作伙伴列表成功");
		},
		{
			query: "queryPartnersList",
			detail: {
				tags: ["Partners"],
				summary: "获取合作伙伴列表（管理后台）",
				description: "获取合作伙伴列表，支持分页、搜索、排序",
			},
		},
	)

	// 根据ID获取合作伙伴详情
	.get(
		"/:id",
		async ({ params: { id }, partnersService }) => {
			try {
				const partner = await partnersService.getPartnerById(id);
				if (!partner) {
					throw new NotFoundError("合作伙伴不存在");
				}
				return commonRes(partner, 200, "获取合作伙伴详情成功");
			} catch (_error) {
				throw new NotFoundError("获取合作伙伴详情失败");
			}
		},
		{
			params: paramIdZod,
			detail: {
				tags: ["Partners"],
				summary: "获取合作伙伴详情",
				description: "根据ID获取合作伙伴详情",
			},
		},
	)

	// 创建合作伙伴
	.post(
		"/",
		async ({ body, partnersService }) => {
			try {
				const newPartner = await partnersService.createPartner(body);
				return commonRes(newPartner, 201, "创建合作伙伴成功");
			} catch (_error) {
				throw new NotFoundError("创建合作伙伴失败", "com");
			}
		},
		{
			body: "insertPartners",
			detail: {
				tags: ["Partners"],
				summary: "创建合作伙伴",
				description: "创建新的合作伙伴",
			},
		},
	)

	// 更新合作伙伴
	.put(
		"/:id",
		async ({ params: { id }, body, partnersService }) => {
			try {
				const updatedPartner = await partnersService.updatePartner(id, body);
				return commonRes(updatedPartner, 200, "更新合作伙伴成功");
			} catch (_error) {
				throw new NotFoundError("创建合作伙伴失败");
			}
		},
		{
			params: paramIdZod,
			body: "updatePartners",
			detail: {
				tags: ["Partners"],
				summary: "更新合作伙伴",
				description: "更新合作伙伴信息",
			},
		},
	)

	// 删除合作伙伴
	.delete(
		"/:id",
		async ({ params: { id }, partnersService }) => {
			await partnersService.deletePartner(id);
			return commonRes(null, 204, "删除合作伙伴成功");
		},
		{
			params: paramIdZod,
			detail: {
				tags: ["Partners"],
				summary: "删除合作伙伴",
				description: "删除指定的合作伙伴",
			},
		},
	);
