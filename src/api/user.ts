import type { PageParams, PageResult } from '@/types/common';
import { http } from './request';
import { mockCreateUser, mockDeleteUser, mockUpdateUser, mockUserList } from './mock';

export type UserStatus = 'active' | 'inactive' | 'pending';

export interface UserInfo {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  status: UserStatus;
  createdAt: string;
  loginCount: number;
}

/**
 * 页面级筛选条件（也是 SearchForm 的 values 结构）。
 * ⚠️ 这里必须用 type 而不是 interface：
 * interface 没有隐式索引签名，无法满足泛型约束 `TFilter extends Record<string, unknown>`。
 */
export type UserFilter = {
  name?: string;
  department?: string;
  status?: UserStatus | '';
  dateRange?: [string, string] | null;
};

export type UserListParams = UserFilter & PageParams & { startTime?: string; endTime?: string };

/** 新增 / 编辑弹窗里 Form 的 values 结构 */
export type UserFormValues = {
  name: string;
  email: string;
  department: string;
  role: string;
  status: UserStatus;
  createdAt: string;
};

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/** 日期区间拆成 startTime / endTime 传给后端，避免数组序列化歧义 */
function toQuery(params: UserListParams): Record<string, unknown> {
  const { dateRange, ...rest } = params;
  const [startTime, endTime] = dateRange ?? [];
  return { ...rest, startTime, endTime };
}

export function fetchUserList(params: UserListParams) {
  if (USE_MOCK) return mockUserList(params);
  return http.get<PageResult<UserInfo>>('/users', toQuery(params));
}

export function createUser(values: UserFormValues) {
  if (USE_MOCK) return mockCreateUser(values);
  return http.post<UserInfo>('/users', values);
}

export function updateUser(id: number, values: UserFormValues) {
  if (USE_MOCK) return mockUpdateUser(id, values);
  return http.put<UserInfo>(`/users/${id}`, values);
}

export function deleteUser(id: number) {
  if (USE_MOCK) return mockDeleteUser(id);
  return http.delete<null>(`/users/${id}`);
}
