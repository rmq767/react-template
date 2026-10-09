import { useMemo } from 'react'
import { ACCESS_ROUTES } from '@/router/access'
import { useAuthStore } from '@/stores/auth'
import type { RoleCode } from '@/types/auth'

/**
 * roles 不声明（或空数组）表示登录即可访问；
 * 声明了则要求「拥有其中任意一个角色」。
 */
export function hasRole(required: RoleCode[] | undefined, owned: RoleCode[]): boolean {
  if (!required?.length) return true
  return required.some(role => owned.includes(role))
}

/** 菜单渲染与按钮级权限都用它，避免两处各写一套判断 */
export function useAccess() {
  const profile = useAuthStore(state => state.profile)

  return useMemo(() => {
    const owned = profile?.roles ?? []
    const routes = ACCESS_ROUTES.filter(route => hasRole(route.roles, owned))

    return {
      routes,
      menuItems: routes.map(route => ({ key: route.path, label: route.title, icon: route.icon })),
      can: (required?: RoleCode[]) => hasRole(required, owned),
    }
  }, [profile])
}
