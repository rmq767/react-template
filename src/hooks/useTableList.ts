import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { TablePaginationConfig } from 'antd'
import type { PageParams, PageResult } from '@/types/common'

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

/** 数组、对象等复杂值用 JSON 存进 URL，标量直接存 */
function serialize(value: unknown): string {
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

function restore(raw: string, fallback: unknown): unknown {
  if (raw.startsWith('[') || raw.startsWith('{')) {
    try {
      return JSON.parse(raw)
    } catch {
      return fallback
    }
  }
  if (typeof fallback === 'number') return Number(raw) || 0
  if (typeof fallback === 'boolean') return raw === 'true'
  return raw
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true
  return Array.isArray(value) && value.length === 0
}

/**
 * 列表页三件套（筛选 + 表格 + 分页）统一逻辑。
 * 等价于 Vue 里的 useSearchFilter + 分页状态 + 请求 loading 手写代码。
 *
 * 状态分层：
 * - 筛选与分页 -> URL search params（可分享、刷新不丢、后退可还原）
 * - 列表数据   -> TanStack Query（loading / error / 缓存 / 竞态全部免写）
 * - 组件内草稿 -> SearchForm 自己维护，点「查询」才提交
 */
export function useTableList<TData, TFilter extends Record<string, unknown>>(
  options: UseTableListOptions<TData, TFilter>,
) {
  const { queryKey, api, defaultFilter, defaultPageSize = 10 } = options
  const [searchParams, setSearchParams] = useSearchParams()

  const filter = useMemo(() => {
    const source = defaultFilter as Record<string, unknown>
    const next: Record<string, unknown> = { ...source }
    for (const name of Object.keys(source)) {
      const raw = searchParams.get(name)
      if (raw !== null) next[name] = restore(raw, source[name])
    }
    return next as TFilter
  }, [searchParams, defaultFilter])

  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || defaultPageSize

  // 用序列化结果做 queryKey：即使 filter 对象引用变化也不会触发多余请求
  const filterJson = useMemo(() => JSON.stringify(filter), [filter])

  const query = useQuery({
    queryKey: [queryKey, filterJson, page, pageSize],
    queryFn: () => api({ ...(JSON.parse(filterJson) as TFilter), page, pageSize }),
    placeholderData: keepPreviousData,
  })

  /** 提交筛选条件，并回到第一页 */
  const submitFilter = useCallback(
    (draft: Partial<TFilter>) => {
      const merged: Record<string, unknown> = { ...filter, ...draft }
      const next = new URLSearchParams(searchParams)
      for (const name of Object.keys(defaultFilter)) {
        const value = merged[name]
        if (isEmpty(value)) next.delete(name)
        else next.set(name, serialize(value))
      }
      next.delete('page')
      setSearchParams(next, { replace: true })
    },
    [filter, searchParams, defaultFilter, setSearchParams],
  )

  /** 清空全部筛选条件 */
  const resetFilter = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    for (const name of Object.keys(defaultFilter)) next.delete(name)
    next.delete('page')
    next.delete('pageSize')
    setSearchParams(next, { replace: true })
  }, [searchParams, defaultFilter, setSearchParams])

  const pagination = useMemo<TablePaginationConfig>(
    () => ({
      current: page,
      pageSize,
      total: query.data?.total ?? 0,
      showSizeChanger: true,
      showTotal: total => `共 ${total} 条`,
      onChange: (nextPage, nextSize) => {
        const params = new URLSearchParams(searchParams)
        params.set('page', String(nextSize !== pageSize ? 1 : nextPage))
        params.set('pageSize', String(nextSize))
        setSearchParams(params, { replace: true })
      },
    }),
    [page, pageSize, query.data?.total, searchParams, setSearchParams],
  )

  const dataSource = useMemo(() => query.data?.list ?? [], [query.data])

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
