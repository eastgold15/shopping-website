// 基础Service类，提供通用的CRUD操作

import { eq, inArray } from 'drizzle-orm';
import { db } from '../../db/connection';

import {
  CustomeError,
  DatabaseError,
  handleDatabaseError,
  NotFoundError,
  ValidationError
} from '../error/customError';
import { commonRes } from '../Res';
import { createPaginator, paginate, type PaginationOptions } from './pagination';
import {
  CreateOptions,
  DeleteOptions,
  PaginatedServiceResponse,
  PaginationParams,



  QueryOptions,



  ServiceResponse,
  UpdateOptions
} from './types';
import {
  buildOrderByClause,
  buildQueryOptions,
  buildWhereClause,
} from './utils';

export abstract class BaseService<T = any, CreateInput = any, UpdateInput = any> {
  protected tableName: string;
  protected schema: any;

  constructor(schema: any, tableName: string) {
    this.schema = schema;
    this.tableName = tableName;
  }

  /**
   * 创建记录
   */
  async create(
    data: CreateInput,
    options: CreateOptions = {}
  ): Promise<ServiceResponse<T>> {
    try {
      // 基础验证
      if (options.validate !== false) {
        await this.validateCreate(data);
      }

      // 插入记录
      const result = await db.insert(this.schema).values(data as any).returning();

      if (!result || result.length === 0) {
        throw new DatabaseError('Failed to create record');
      }

      return commonRes(result[0]);
    } catch (error) {
      if (error instanceof CustomeError) {
        throw error;
      }

      throw handleDatabaseError(error);
    }

  }

  /**
   * 批量创建记录
   */
  async createBatch(
    data: CreateInput[],
    options: CreateOptions = {}
  ): Promise<ServiceResponse<T[]>> {
    try {
      if (!data || data.length === 0) {
        throw new ValidationError('No data provided for batch creation');
      }

      // 验证每条记录
      if (options.validate !== false) {
        for (const item of data) {
          await this.validateCreate(item);
        }
      }

      // 批量插入
      const result = await db.insert(this.schema).values(data).returning();

      return commonRes(result);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 根据ID查找记录
   */
  async findById(id: number): Promise<ServiceResponse<T | null>> {
    try {
      const result = await db
        .select()
        .from(this.schema)
        .where(eq(this.schema.id, id))
        .limit(1);

      if (!result || result.length === 0) {
        return commonRes(null);
      }

      return commonRes(result[0]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 根据条件查找记录
   */
  async findOne(filters: Record<string, any>): Promise<ServiceResponse<T | null>> {
    try {
      const queryOptions = buildQueryOptions(filters);
      const whereClause = buildWhereClause(
        Object.entries(queryOptions).map(([field, value]) => ({
          field,
          operator: 'eq',
          value
        })),
        this.schema
      );

      const result = await db
        .select()
        .from(this.schema)
        .where(whereClause)
        .limit(1);

      if (!result || result.length === 0) {
        return commonRes(null);
      }

      return commonRes(result[0]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 查询列表
   */
  async findMany(queryOptions: QueryOptions = {}): Promise<ServiceResponse<T[]>> {
    try {
      const whereClause = buildWhereClause(queryOptions.filters || [], this.schema);
      const orderByClause = buildOrderByClause(queryOptions.sort || [], this.schema);

      let query = db.select().from(this.schema).$dynamic();

      if (whereClause) {
        query = query.where(whereClause);
      }

      if (orderByClause.length > 0) {
        query = query.orderBy(...orderByClause);
      }

      const result = await query;
      return commonRes(result);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 分页查询 - 使用分页插件
   */
  async findPaginated(
    pagination: PaginationParams,
    queryOptions: QueryOptions = {}
  ): Promise<PaginatedServiceResponse<T>> {
    try {


      const whereClause = buildWhereClause(queryOptions.filters || [], this.schema);
      const orderByClause = buildOrderByClause(queryOptions.sort || [], this.schema);

      // 构建数据查询
      let dataQuery = db.select().from(this.schema).$dynamic();
      if (whereClause) {
        dataQuery = dataQuery.where(whereClause);
      }
      if (orderByClause.length > 0) {
        dataQuery = dataQuery.orderBy(...orderByClause);
      }

      // 构建计数查询
      let countQuery = db.select({ count: this.schema.id }).from(this.schema).$dynamic();
      if (whereClause) {
        countQuery = countQuery.where(whereClause);
      }

      // 使用分页插件进行分页查询
      return await paginate(dataQuery, countQuery, {
        page: pagination.page,
        pageSize: pagination.pageSize,
        orderBy: orderByClause.length > 0 ? orderByClause[0] : undefined,
        orderDirection: queryOptions.sort?.[0]?.direction || 'asc'
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 创建分页器 - 复用分页插件的 createPaginator
   */
  createPaginator(queryOptions: QueryOptions = {}): (options: Partial<PaginationOptions>) => Promise<PaginatedServiceResponse<T>> {
    const whereClause = buildWhereClause(queryOptions.filters || [], this.schema);
    const orderByClause = buildOrderByClause(queryOptions.sort || [], this.schema);

    // 构建数据查询
    let dataQuery = db.select().from(this.schema).$dynamic();
    if (whereClause) {
      dataQuery = dataQuery.where(whereClause);
    }
    if (orderByClause.length > 0) {
      dataQuery = dataQuery.orderBy(...orderByClause);
    }

    // 构建计数查询
    let countQuery = db.select({ count: this.schema.id }).from(this.schema).$dynamic();
    if (whereClause) {
      countQuery = countQuery.where(whereClause);
    }

    // 使用分页插件创建分页器
    return createPaginator(
      dataQuery,
      countQuery,
      orderByClause.length > 0 ? orderByClause[0] : undefined,
      this.schema
    );
  }

  /**
   * 更新记录
   */
  async update(
    id: number,
    data: UpdateInput,
    options: UpdateOptions = {}
  ): Promise<ServiceResponse<T>> {
    try {
      // 检查记录是否存在
      const existing = await this.findById(id);
      if (!existing.data || existing.data == null) {
        throw new NotFoundError(`Record with id ${id} not found`);
      }


      // 执行更新
      const result = await db
        .update(this.schema)
        .set(data as any)
        .where(eq(this.schema.id, id))
        .returning();

      if (!result || result.length === 0) {
        throw new DatabaseError('Failed to update record');
      }

      return commonRes(result[0]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 删除记录
   */
  async delete(id: number, options: DeleteOptions = {}): Promise<ServiceResponse<boolean>> {
    try {
      // 检查记录是否存在
      const existing = await this.findById(id);
      if (!existing.data == null || !existing.data) {

        throw new NotFoundError(`Record with id ${id} not found`);
      }

      // 执行删除
      const result = await db
        .delete(this.schema)
        .where(eq(this.schema.id, id))
        .returning({ id: this.schema.id });

      if (!result || result.length === 0) {
        throw new DatabaseError('Failed to delete record');
      }

      return commonRes(true);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 批量删除记录
   */
  async deleteBatch(ids: number[]): Promise<ServiceResponse<number>> {
    try {
      if (!ids || ids.length === 0) {
        throw new ValidationError('No IDs provided for batch deletion');
      }

      const result = await db
        .delete(this.schema)
        .where(inArray(this.schema.id, ids))
        .returning({ id: this.schema.id });

      const deletedCount = result.length;
      return commonRes(deletedCount);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 统计记录数量
   */
  async count(filters: Record<string, any> = {}): Promise<ServiceResponse<number>> {
    try {
      const queryOptions = buildQueryOptions(filters);
      const whereClause = buildWhereClause(
        Object.entries(queryOptions).map(([field, value]) => ({
          field,
          operator: 'eq',
          value
        })),
        this.schema
      );

      let query = db.select({ count: this.schema.id }).from(this.schema).$dynamic();
      if (whereClause) {
        query = query.where(whereClause);
      }

      const result = await query;
      return commonRes(result.length);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 检查记录是否存在
   */
  async exists(id: number): Promise<ServiceResponse<boolean>> {
    try {
      const result = await this.findById(id);
      return commonRes(result.data !== null);
    } catch (error) {
      throw error;
    }
  }
  // 抽象方法，子类可以实现具体的验证逻辑
  protected async validateCreate(data: CreateInput): Promise<void> {
    // 默认实现，子类可以重写
  }

  protected async validateUpdate(data: UpdateInput): Promise<void> {
    // 默认实现，子类可以重写
  }


  // 获取表名
  getTableName(): string {
    return this.tableName;
  }

  // 获取schema
  getSchema(): any {
    return this.schema;
  }
}