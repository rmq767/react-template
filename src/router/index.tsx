import { Suspense, lazy, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { Spin } from 'antd'
import BasicLayout from '@/layouts/BasicLayout'

const HomePage = lazy(() => import('@/pages/Home'))
const UserListPage = lazy(() => import('@/pages/UserList'))

/** 路由级代码分割：每个页面单独一个 chunk */
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
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <BasicLayout />,
    children: [
      { index: true, element: withSuspense(<HomePage />) },
      { path: 'users', element: withSuspense(<UserListPage />) },
    ],
  },
])
