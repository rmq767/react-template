import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
  dark: boolean
  collapsed: boolean
  toggleDark: () => void
  toggleCollapsed: () => void
}

/**
 * 只放「跨页面、且服务端不关心」的 UI 状态。
 * 业务数据一律走 TanStack Query，筛选/分页走 URL，不要塞进 store。
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      dark: false,
      collapsed: false,
      toggleDark: () => set(state => ({ dark: !state.dark })),
      toggleCollapsed: () => set(state => ({ collapsed: !state.collapsed })),
    }),
    { name: 'app-theme' },
  ),
)
