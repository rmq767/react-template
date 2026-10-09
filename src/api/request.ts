import axios from 'axios'
import type { ApiResponse } from '@/types/common'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
})

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** 校验业务码，非 0 抛出错误，由 TanStack Query 统一接管 error 状态 */
function unwrap<T>(body: ApiResponse<T>): T {
  if (typeof body.code === 'number' && body.code !== 0) {
    throw new Error(body.message || '请求失败')
  }
  return body.data
}

/**
 * 统一出口：泛型直接写业务数据类型，不要在业务里再解包 response。
 * loading / error / 重试 / 缓存全部交给 useQuery，组件里不写请求生命周期。
 */
export const http = {
  get: async <T>(url: string, params?: Record<string, unknown>) =>
    unwrap((await instance.get<ApiResponse<T>>(url, { params })).data),

  post: async <T>(url: string, data?: Record<string, unknown>) =>
    unwrap((await instance.post<ApiResponse<T>>(url, data)).data),

  put: async <T>(url: string, data?: Record<string, unknown>) =>
    unwrap((await instance.put<ApiResponse<T>>(url, data)).data),

  delete: async <T>(url: string) => unwrap((await instance.delete<ApiResponse<T>>(url)).data),
}

export default instance
