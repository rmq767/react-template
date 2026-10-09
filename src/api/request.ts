import axios from 'axios';
import { getAccessToken, useAuthStore } from '@/stores/auth';
import type { ApiResponse } from '@/types/common';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
});

/**
 * 错误提示出口：由 App 内部的桥接组件把 context 版 `message.error` 递进来
 * （antd 静态方法拿不到主题，暗色下会弹出一张亮色 toast，所以不在这里直接 import 静态 message）。
 * 未绑定时静默：单测 / 提前报错也不该影响主流程。
 */
let notify: (content: string) => void = () => {};
export function bindErrorNotify(fn: (content: string) => void) {
  notify = fn;
}

// 相同文案短时间内只弹一次：并发失败的多个请求不该把屏幕刷屏
let lastText = '';
let lastAt = 0;
function showError(content: string) {
  const now = Date.now();
  if (content === lastText && now - lastAt < 1500) return;
  lastText = content;
  lastAt = now;
  notify(content);
}

/** 业务码非 0 即失败；判定逻辑给拦截器与 unwrap 共用，避免两处漂移 */
function businessError(body: unknown): string | null {
  const data = body as ApiResponse<unknown> | null | undefined;
  // 204 空响应 / 网关返回 HTML 错误页时 body 不是预期结构，这里不能直接读 .code
  if (data && typeof data.code === 'number' && data.code !== 0) {
    return data.message || '请求失败';
  }
  return null;
}

/**
 * 只有查询类（GET）失败才在这里全局提示：
 * 写操作（新增/编辑/删除/登录）的失败文案由调用方 `useMutation` 自己给（“删除失败”比“请求失败”有用），
 * 两边都提示就成了双重弹窗。
 */
function isQuery(config?: { method?: string }) {
  return (config?.method ?? 'get').toLowerCase() === 'get';
}

instance.interceptors.request.use(config => {
  // token 统一从 auth store 取（zustand persist 已落 localStorage），避免两处读写不一致
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * 全局响应拦截：页面不再自写错误 UI（列表不挂 Alert / 重试按钮），失败提示统一在这里。
 */
instance.interceptors.response.use(
  // HTTP 200 但业务码非 0：GET 先全局 toast，抛错仍交给 react-query 接管 error 态
  response => {
    if (isQuery(response.config)) {
      const text = businessError(response.data);
      if (text) showError(text);
    }
    return response;
  },
  error => {
    if (error.response?.status === 401) {
      // 只清登录态：AuthGuard 订阅了 token，会自动把用户送回 /login，这里不必操作路由
      useAuthStore.getState().signOut();
      showError('登录已过期，请重新登录');
    } else if (isQuery(error.config)) {
      showError(resolveHttpError(error));
    }
    return Promise.reject(error);
  },
);

/** 把 axios 的异常翻译成人能看懂的一句话 */
function resolveHttpError(error: unknown): string {
  const err = error as { response?: { status?: number; data?: unknown }; message?: string };
  const gatewayText = businessError(err.response?.data);
  if (gatewayText) return gatewayText;
  if (err.response?.status) return `请求失败（${err.response.status}）`;
  return err.message === 'Network Error' ? '网络异常，请检查后端服务' : '请求超时，请稍后重试';
}

/** 校验业务码，非 0 抛出错误，由 TanStack Query 统一接管 error 状态 */
function unwrap<T>(body: ApiResponse<T>): T {
  const text = businessError(body);
  if (text) throw new Error(text);
  return body.data;
}

/**
 * 统一出口：泛型直接写业务数据类型，不要在业务里再解包 response。
 * loading / error / 重试 / 缓存全部交给 useQuery，组件里不写请求生命周期。
 * ≈ Vue 项目里封装的 request.js：只是发请求，不管何时调、不调失败重试（那是 react-query 的活）。
 */
export const http = {
  get: async <T>(url: string, params?: Record<string, unknown>) =>
    unwrap((await instance.get<ApiResponse<T>>(url, { params })).data),

  post: async <T>(url: string, data?: Record<string, unknown>) =>
    unwrap((await instance.post<ApiResponse<T>>(url, data)).data),

  put: async <T>(url: string, data?: Record<string, unknown>) =>
    unwrap((await instance.put<ApiResponse<T>>(url, data)).data),

  delete: async <T>(url: string) => unwrap((await instance.delete<ApiResponse<T>>(url)).data),
};

export default instance;
