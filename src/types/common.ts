/** 后端统一响应结构 */
export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

/** 列表接口返回的分页结构 */
export interface PageResult<T> {
  list: T[];
  total: number;
}

/** 分页请求参数 */
export interface PageParams {
  page: number;
  pageSize: number;
}
