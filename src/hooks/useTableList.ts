import { useCallback, useMemo, useState } from 'react'
import type { TablePaginationConfig } from 'antd'
import type { PageParams, PageResult } from '@/types/common'
import { useUrlFilter } from './useUrlFilter'
import { useListQuery } from './useListQuery'

export interface UseTableListOptions<TData, TFilter extends Record<string, unknown>> {
  /** 缓存 key，同一页面唯一 */
  queryKey: string
  /** 列表请求函数 */
  api: (params: PageParams & TFilter) => Promise<PageResult<TData>>
  /**
   * 默认筛选值，同时充当「哪些 URL 参数属于筛选条件」的白名单。
   * ⚠️ 必须在组件外部定义常量，不能每次 render 新建对象。
   */
  defaultFilter: TFilter
  defaultPageSize?: number
}

/**
 * 列表页三件套（筛选 + 表格 + 分页）统一入口 —— 只做「组合」，不写具体逻辑。
 *
 * 分层：
 * - useUrlFilter  -> 筛选与分页 <-> URL（可分享、刷新不丢、后退可还原）
 * - useListQuery  -> TanStack Query 数据层（loading / error / 缓存 / 竞态全部免写）
 * - 本 hook        -> 把两层拼起来，外加 antd 分页配置与「查询动作」计数
 */
export function useTableList<TData, TFilter extends Record<string, unknown>>(
  options: UseTableListOptions<TData, TFilter>,
) {
  const { queryKey, api, defaultFilter, defaultPageSize = 10 } = options
  const { filter, page, pageSize, setFilter, reset, setPagination } = useUrlFilter<TFilter>({
    defaultFilter,
    defaultPageSize,
  })

  // 「查询动作」计数：每次点「查询」/「重置」自增，让 queryKey 产生新引用。
  // 这样即便筛选与当前完全一致、且组件已挂载（staleTime:0 只在挂载/key 变时自动拉），
  // 也能保证「点一次查询 = 发一次请求」。
  // ≈ Vue 里没有响应式重拉机制时的手动 `getList()`；React 靠改 key 声明式触发。
  const [nonce, setNonce] = useState(0)

  const query = useListQuery<TData, TFilter>({ queryKey, api, filter, page, pageSize, nonce })

  /** 提交筛选条件，回到第一页，并触发一次查询（≈ 一次显式「查询」动作，顺带把条件写进 URL） */
  const submitFilter = useCallback(
    (draft: Partial<TFilter>) => {
      setFilter({ ...filter, ...draft })
      setNonce(n => n + 1)
    },
    [setFilter, filter],
  )

  /** 清空全部筛选条件，并触发一次查询 */
  const resetFilter = useCallback(() => {
    reset()
    setNonce(n => n + 1)
  }, [reset])

  const pagination = useMemo<TablePaginationConfig>(
    () => ({
      current: page,
      pageSize,
      total: query.data?.total ?? 0,
      showSizeChanger: true,
      showTotal: total => `共 ${total} 条`,
      onChange: setPagination,
    }),
    [page, pageSize, query.data?.total, setPagination],
  )

  const dataSource = useMemo(() => query.data?.list ?? [], [query.data])

  // 多数列表页只用前六项；total/refetch/query 为高级场景预留（自定义汇总、手动重拉、读 error 状态）。
  return {
    filter,
    dataSource,
    total: query.data?.total ?? 0,
    /** 翻页时保留旧数据的同时显示 loading，避免表格闪烁 */
    loading: query.isFetching,
    pagination,
    submitFilter,
    resetFilter,
    refetch: query.refetch,
    query,
  }
}
