import { lazy, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react'
import { AppstoreOutlined, AuditOutlined, HomeOutlined } from '@ant-design/icons'
import type { RoleCode } from '@/types/auth'

export interface AccessRoute {
  /** 同时作为菜单 key；'/' 会被注册成 index 路由 */
  path: string
  title: string
  icon: ReactNode
  /** 不声明 = 登录即可访问；声明 = 拥有其中任一角色才可访问 */
  roles?: RoleCode[]
  component: LazyExoticComponent<ComponentType>
}

/**
 * 菜单与路由的唯一数据源。
 * 新增页面只改这里：BasicLayout 的菜单、router 的 children、角色过滤全部由它派生，
 * 不会出现「菜单藏了但路由还能直连」这种不一致。
 */
export const ACCESS_ROUTES: AccessRoute[] = [
  {
    path: '/',
    title: '技术栈总览',
    icon: <HomeOutlined />,
    component: lazy<ComponentType>(() => import('@/pages/Home')),
  },
  {
    path: '/users',
    title: '用户列表',
    icon: <AppstoreOutlined />,
    roles: ['admin', 'editor'],
    component: lazy<ComponentType>(() => import('@/pages/UserList')),
  },
  {
    path: '/audit',
    title: '操作日志',
    icon: <AuditOutlined />,
    roles: ['admin'],
    component: lazy<ComponentType>(() => import('@/pages/Audit')),
  },
]
