// 软删除工具函数
import { eq, isNull } from 'drizzle-orm'
import type { SoftDeletableTable } from './types'
import { QueryScope } from './types'

/**
 * 创建只查询未删除记录的条件
 * @param table 软删除表
 * @returns 查询条件
 */
export function notDeleted(table: SoftDeletableTable) {
  return isNull(table.deletedAt)
}

/**
 * 创建只查询已删除记录的条件  
 * @param table 软删除表
 * @returns 查询条件
 */
export function onlyDeleted(table: SoftDeletableTable) {
  return eq(table.deletedAt, new Date())
}

/**
 * 创建软删除条件
 * @param table 软删除表
 * @param scope 查询范围
 * @returns 查询条件或undefined
 */
export function createSoftDeleteCondition(
  table: SoftDeletableTable, 
  scope: QueryScope = QueryScope.ACTIVE
) {
  switch (scope) {
    case QueryScope.ACTIVE:
      return notDeleted(table)
    case QueryScope.DELETED:
      return onlyDeleted(table)
    case QueryScope.ALL:
      return undefined
    default:
      return notDeleted(table)
  }
}

/**
 * 检查表是否支持软删除
 * @param table 表对象
 * @returns 是否支持软删除
 */
export function isSoftDeletable(table: any): table is SoftDeletableTable {
  return table && 'deletedAt' in table
}