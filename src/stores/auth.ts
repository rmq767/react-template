import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginResult, UserProfile } from '@/types/auth'

interface AuthState {
  token: string | null
  profile: UserProfile | null
  signIn: (result: LoginResult) => void
  signOut: () => void
}

/** 登录态属于「跨页面 UI 状态」，放 Zustand 并持久化，刷新后不掉登录 */
export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      token: null,
      profile: null,
      signIn: ({ token, profile }) => set({ token, profile }),
      signOut: () => set({ token: null, profile: null }),
    }),
    { name: 'app-auth' },
  ),
)

/**
 * 供非组件环境（axios 拦截器、router 外的工具函数）读取。
 * 组件里请仍然用 useAuthStore(selector)，否则拿不到响应式更新。
 */
export const getAccessToken = () => useAuthStore.getState().token
