import {
	and,
	asc,
	desc,
	eq,
	getTableColumns,
	like,
	or,
	sql,
} from "drizzle-orm";
import { db } from "../../db/connection";
import { partnersSchema } from "../../db/schema";
import type {
	CreatePartnerDto,
	UnifiedQueryParams,
	UpdatePartnerDto,
	UpdateSortRequest,
} from "./partners.model";

/**
 * 合作伙伴服务类
 * 处理合作伙伴相关的业务逻辑
 */
export class PartnersService {
	private readonly columns = getTableColumns(partnersSchema);

	/**
	 * 获取启用的合作伙伴列表（前台用）
	 * @returns 启用的合作伙伴列表，按排序权重排序
	 */
	async getActivePartnersList() {
		return await db
			.select(this.columns)
			.from(partnersSchema)
			.where(eq(partnersSchema.isActive, true))
			.orderBy(asc(partnersSchema.sortOrder));
	}

	/**
	 * 获取合作伙伴列表（管理后台用）
	 * @param params 查询参数
	 * @returns 分页的合作伙伴列表
	 */
	async getPartnersList(params: UnifiedQueryParams) {
		const {
			page = 1,
			pageSize = 10,
			sortBy = "sortOrder",
			sortOrder = "asc",
			search,
			name,
			isActive,
		} = params;

		// 搜索条件构建
		const conditions = [];

		// search参数：使用or连接多个字段搜索
		if (search) {
			conditions.push(
				or(
					like(partnersSchema.name, `%${search}%`),
					like(partnersSchema.description, `%${search}%`),
				),
			);
		}

		// 独立的精确搜索条件
		if (name) {
			conditions.push(like(partnersSchema.name, `%${name}%`));
		}
		if (isActive !== undefined) {
			conditions.push(eq(partnersSchema.isActive, isActive));
		}

		// 构建where条件
		const whereCondition =
			conditions.length > 0 ? and(...conditions) : undefined;

		// 排序字段映射
		const sortFieldMap: Record<string, any> = {
			name: partnersSchema.name,
			sortOrder: partnersSchema.sortOrder,
			createdAt: partnersSchema.createdAt,
			updatedAt: partnersSchema.updatedAt,
		};

		const sortField = sortFieldMap[sortBy] || partnersSchema.sortOrder;
		const orderBy = sortOrder === "desc" ? desc(sortField) : asc(sortField);

		// 计算总数
		const totalQuery = db.select({ count: sql`count(*)` }).from(partnersSchema);

		if (whereCondition) {
			totalQuery.where(whereCondition);
		}

		const [{ count }] = await totalQuery;
		const total = Number(count);

		// 分页查询
		const offset = (page - 1) * pageSize;
		const dataQuery = db
			.select(this.columns)
			.from(partnersSchema)
			.orderBy(orderBy)
			.limit(pageSize)
			.offset(offset);

		if (whereCondition) {
			dataQuery.where(whereCondition);
		}

		const data = await dataQuery;

		return {
			data,
			total,
			page,
			pageSize,
		};
	}

	/**
	 * 根据ID获取合作伙伴详情
	 * @param id 合作伙伴ID
	 * @returns 合作伙伴详情或null
	 */
	async getPartnerById(id: number) {
		const [partner] = await db
			.select(this.columns)
			.from(partnersSchema)
			.where(eq(partnersSchema.id, id));

		return partner || null;
	}

	/**
	 * 创建合作伙伴
	 * @param data 创建数据
	 * @returns 创建的合作伙伴
	 */
	async createPartner(data: CreatePartnerDto) {
		const [newPartner] = await db
			.insert(partnersSchema)
			.values(data)
			.returning(this.columns);

		return newPartner;
	}

	/**
	 * 更新合作伙伴
	 * @param id 合作伙伴ID
	 * @param data 更新数据
	 * @returns 更新后的合作伙伴或null
	 */
	async updatePartner(id: number, data: UpdatePartnerDto) {
		const [updatedPartner] = await db
			.update(partnersSchema)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(partnersSchema.id, id))
			.returning(this.columns);

		return updatedPartner || null;
	}

	/**
	 * 删除合作伙伴
	 * @param id 合作伙伴ID
	 * @returns 是否删除成功
	 */
	async deletePartner(id: number) {
		const result = await db
			.delete(partnersSchema)
			.where(eq(partnersSchema.id, id));

		if (result.count === 1) {
			console.log("成功删除了一条记录");
			return { success: true, message: "删除成功" };
		} else if (result.count === 0) {
			console.log("没有找到匹配的记录，无法删除");
			return { success: false, message: "未找到该记录" };
		}
	}

	/**
	 * 更新合作伙伴排序
	 * @param id 合作伙伴ID
	 * @param data 排序数据
	 * @returns 更新后的合作伙伴或null
	 */
	async updatePartnerSort(id: number, data: UpdateSortRequest) {
		const [updatedPartner] = await db
			.update(partnersSchema)
			.set({
				sortOrder: data.sortOrder,
				updatedAt: new Date(),
			})
			.where(eq(partnersSchema.id, id))
			.returning(this.columns);

		return updatedPartner || null;
	}

	/**
	 * 切换合作伙伴启用状态
	 * @param id 合作伙伴ID
	 * @returns 更新后的合作伙伴或null
	 */
	async togglePartnerActive(id: number) {
		// 先获取当前状态
		const currentPartner = await this.getPartnerById(id);
		if (!currentPartner) {
			return null;
		}

		// 切换状态
		const [updatedPartner] = await db
			.update(partnersSchema)
			.set({
				isActive: !currentPartner.isActive,
				updatedAt: new Date(),
			})
			.where(eq(partnersSchema.id, id))
			.returning(this.columns);

		return updatedPartner || null;
	}
}
