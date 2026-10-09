import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { PageParams, PageResult } from '@/types/common'

export interface UseListQueryOptions<TData, TFilter extends Record<string, unknown>> {
  /** 缓存命名空间，同一列表唯一；删除/新增后用 invalidateQueries 命中它刷新 */
  queryKey: string
  /** 列表请求函数：只接收参数、返回 Promise，不关心缓存 */
  api: (params: PageParams & TFilter) => Promise<PageResult<TData>>
  /** 当前生效的筛选值 */
  filter: TFilter
  page: number
  pageSize: number
  /**
   * 「查询动作」计数器。
   * 表达一次显式的「点查询/重置」：让 queryKey 产生新引用，
   * 即便当前已挂载且筛选完全没变，也能触发一次新的请求。
   */
  nonce?: number
}

/**
 * 纯数据层：把 api 交给 useQuery，负责 loading / error / 缓存 / 竞态 / 翻页保留旧数据。
 * 不含路由、不含 UI 组件配置，可脱离页面单独使用或做单元测试。
 */
export function useListQuery<TData, TFilter extends Record<string, unknown>>(
  options: UseListQueryOptions<TData, TFilter>,
) {
  const { queryKey, api, filter, page, pageSize, nonce = 0 } = options

  return useQuery({
    // filter 直接进 key 即可：react-query 会对 queryKey 做深序列化比较，
    // 内容相同就不算「新查询」，无需再手动 JSON.stringify。
    queryKey: [queryKey, filter, page, pageSize, nonce],
    queryFn: () => api({ ...filter, page, pageSize }),
    placeholderData: keepPreviousData,
    // 列表要求实时：数据永远视为过期，每次挂载/回到页面都重新拉最新
    // （等价于 Vue keep-alive 里在 activated 手动重新请求，这里交给框架）。
    staleTime: 0,
  })
}
