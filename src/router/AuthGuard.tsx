import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth';
import { hasRole } from '@/hooks/useAccess';
import type { RoleCode } from '@/types/auth';

export interface AuthGuardProps {
  roles?: RoleCode[];
  children: ReactNode;
}

/**
 * 声明式路由守卫（对应 Vue 的 beforeEach + meta.roles）。
 * React Router 没有全局导航守卫，用组件包裹每个路由元素，
 * 好处是权限声明和路由表贴在一起，且能被 useAccess 复用。
 */
export default function AuthGuard({ roles, children }: AuthGuardProps) {
  const location = useLocation();
  const token = useAuthStore(state => state.token);
  const profile = useAuthStore(state => state.profile);

  if (!token) {
    // 带上原地址（含 query），登录后跳回
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (!hasRole(roles, profile?.roles ?? [])) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
