// 软删除相关类型定义
import { SQL } from 'drizzle-orm'
import type { PgColumn } from 'drizzle-orm/pg-core'

/**
 * 查询范围枚举
 */
export enum QueryScope {
  ACTIVE = 'active',    // 只查询未删除的记录
  DELETED = 'deleted',  // 只查询已删除的记录
  ALL = 'all'          // 查询所有记录
}

/**
 * 软删除表接口
 */
export interface SoftDeletableTable {
  deletedAt: PgColumn | SQL.Aliased
}

/**
 * 软删除选项
 */
export interface SoftDeleteOptions {
  scope?: QueryScope
  deletedAtColumn?: string
}