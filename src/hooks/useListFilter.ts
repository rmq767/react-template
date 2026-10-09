import { useCallback, useState } from 'react';

/**
 * 列表筛选 / 分页状态。
 * 唯一职责：在组件内存住 filter、page、pageSize，默认进页面即「空筛选 + page=1 + pageSize=10」。
 * 不再与地址栏同步（不做可分享 / 刷新保留 / 后退还原）。
 * 不涉及数据请求、不涉及 UI 组件配置，可独立单测。
 *
 * 心智对照：
 * - 三份 `useState` ≈ Vue 的 `ref`；改 filter 只会换 filter 引用，翻页只换 page/pageSize，
 *   互不牵连 —— 下游 SearchForm 靠 `values` 引用变化回填草稿，翻页不会误清未提交的输入；
 * - `useCallback` 包住的写回方法 ≈ 保证引用稳定，避免传给子组件时其无谓重渲染。
 */

export interface ListFilterState<TFilter extends Record<string, unknown>> {
  filter: TFilter;
  page: number;
  pageSize: number;
}

export interface ListFilterActions {
  /** 写入筛选条件并回到第一页 */
  setFilter: (next: Record<string, unknown>) => void;
  /** 清空筛选与分页，回到默认第一页 */
  reset: () => void;
  /** 切换页码或每页条数（每页条数变化时自动回到第一页） */
  setPagination: (page: number, pageSize: number) => void;
}

export interface UseListFilterOptions<TFilter extends Record<string, unknown>> {
  /** 默认筛选值，同时作为重置目标。⚠️ 必须是组件外常量。 */
  defaultFilter: TFilter;
  defaultPageSize?: number;
}

export function useListFilter<TFilter extends Record<string, unknown>>(
  options: UseListFilterOptions<TFilter>,
): ListFilterState<TFilter> & ListFilterActions {
  const { defaultFilter, defaultPageSize = 10 } = options;

  // filter 单独成态：只有 setFilter / reset 才会换引用，翻页不牵连它。
  const [filter, setFilterState] = useState<TFilter>(defaultFilter);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const setFilter = useCallback((next: Record<string, unknown>) => {
    setFilterState(next as TFilter);
    // 改筛选回第一页
    setPage(1);
  }, []);

  const reset = useCallback(() => {
    setFilterState(defaultFilter);
    setPage(1);
    setPageSize(defaultPageSize);
  }, [defaultFilter, defaultPageSize]);

  const setPagination = useCallback(
    (nextPage: number, nextPageSize: number) => {
      // 每页条数变了先回第一页，否则保持目标页
      setPage(nextPageSize !== pageSize ? 1 : nextPage);
      setPageSize(nextPageSize);
    },
    [pageSize],
  );

  return { filter, page, pageSize, setFilter, reset, setPagination };
}
