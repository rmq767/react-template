import { Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Spin } from 'antd';
import BasicLayout from '@/layouts/BasicLayout';
import LoginPage from '@/pages/Login';
import ForbiddenPage from '@/pages/Forbidden';
import NotFoundPage from '@/pages/NotFound';
import AuthGuard from './AuthGuard';
import { ACCESS_ROUTES, type AccessRoute } from './access';

const withSuspense = (node: ReactNode) => (
  <Suspense
    fallback={
      <div className="page-loading">
        <Spin size="large" />
      </div>
    }
  >
    {node}
  </Suspense>
);

/** 页面级守卫：未登录跳登录页，无权限跳 403。菜单和路由都源自 ACCESS_ROUTES */
function guarded(route: AccessRoute) {
  const Page = route.component;
  return <AuthGuard roles={route.roles}>{withSuspense(<Page />)}</AuthGuard>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    // 布局整体需要登录
    element: (
      <AuthGuard>
        <BasicLayout />
      </AuthGuard>
    ),
    children: ACCESS_ROUTES.map(route =>
      route.path === '/'
        ? { index: true, element: guarded(route) }
        : { path: route.path.slice(1), element: guarded(route) },
    ),
  },
  // 403/404 放在布局外：避免未登录时被布局守卫二次拦截产生歧义
  { path: '/403', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
