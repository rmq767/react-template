import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * URL 查询参数 <-> 列表筛选/分页状态。
 * 唯一职责：把 filter、page、pageSize 同步到地址栏，让列表「可分享、刷新不丢、后退可还原」。
 * 不涉及数据请求、不涉及 UI 组件配置，可独立单测。
 *
 * 心智对照：
 * - `useMemo` 从 URL 派生 state ≈ Vue 的 computed（URL 变则自动重算）；
 * - `useCallback` 包住的写回方法 ≈ 保证引用稳定，避免传给子组件时其无谓重渲染；
 * - 所有写 URL 统一 `replace: true` ≈ router.replace，不给浏览器历史栈堆记录（翻页/改筛选不产生后退点）。
 */

/** 数组、对象等复杂值用 JSON 存进 URL，标量直接存 */
export function serialize(value: unknown): string {
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

/** 依据默认值的类型把 URL 字符串还原成强类型值；解析失败回退默认值 */
export function restore(raw: string, fallback: unknown): unknown {
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

/** 空值不写入 URL，保持地址简洁 */
export function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true
  return Array.isArray(value) && value.length === 0
}

export interface UrlFilterState<TFilter extends Record<string, unknown>> {
  filter: TFilter
  page: number
  pageSize: number
}

export interface UrlFilterActions {
  /** 写入筛选条件并回到第一页 */
  setFilter: (next: Record<string, unknown>) => void
  /** 清空筛选与分页，回到默认第一页 */
  reset: () => void
  /** 切换页码或每页条数（每页条数变化时自动回到第一页） */
  setPagination: (page: number, pageSize: number) => void
}

export interface UseUrlFilterOptions<TFilter extends Record<string, unknown>> {
  /** 默认筛选值，同时充当「哪些 URL 参数属于筛选条件」的白名单。⚠️ 必须是组件外常量。 */
  defaultFilter: TFilter
  defaultPageSize?: number
}

export function useUrlFilter<TFilter extends Record<string, unknown>>(
  options: UseUrlFilterOptions<TFilter>,
): UrlFilterState<TFilter> & UrlFilterActions {
  const { defaultFilter, defaultPageSize = 10 } = options
  const [searchParams, setSearchParams] = useSearchParams()

  // ≈ computed：依赖 searchParams，地址栏一变就重新解析出强类型筛选值与分页
  const state = useMemo<UrlFilterState<TFilter>>(() => {
    const source = defaultFilter as Record<string, unknown>
    const filter: Record<string, unknown> = { ...source }
    for (const name of Object.keys(source)) {
      const raw = searchParams.get(name)
      if (raw !== null) filter[name] = restore(raw, source[name])
    }
    return {
      filter: filter as TFilter,
      page: Number(searchParams.get('page')) || 1,
      pageSize: Number(searchParams.get('pageSize')) || defaultPageSize,
    }
  }, [searchParams, defaultFilter, defaultPageSize])

  const setFilter = useCallback(
    (next: Record<string, unknown>) => {
      const params = new URLSearchParams(searchParams)
      for (const name of Object.keys(defaultFilter)) {
        const value = next[name]
        if (isEmpty(value)) params.delete(name)
        else params.set(name, serialize(value))
      }
      // 改筛选回第一页
      params.delete('page')
      setSearchParams(params, { replace: true })
    },
    [searchParams, defaultFilter, setSearchParams],
  )

  const reset = useCallback(() => {
    const params = new URLSearchParams(searchParams)
    for (const name of Object.keys(defaultFilter)) params.delete(name)
    params.delete('page')
    params.delete('pageSize')
    setSearchParams(params, { replace: true })
  }, [searchParams, defaultFilter, setSearchParams])

  const setPagination = useCallback(
    (page: number, pageSize: number) => {
      const params = new URLSearchParams(searchParams)
      // 每页条数变了先回第一页，否则保持目标页
      params.set('page', String(pageSize !== state.pageSize ? 1 : page))
      params.set('pageSize', String(pageSize))
      setSearchParams(params, { replace: true })
    },
    [searchParams, state.pageSize, setSearchParams],
  )

  return { ...state, setFilter, reset, setPagination }
}
