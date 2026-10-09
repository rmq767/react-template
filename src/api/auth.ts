import type { LoginPayload, LoginResult, RoleCode, UserProfile } from '@/types/auth'
import { http } from './request'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/**
 * 演示账号，密码统一 123456。
 * 三个角色分别对应「全部可见 / 部分可见 / 只读」，方便验证菜单过滤与 403 拦截。
 */
const DEMO_ACCOUNTS: Record<string, { name: string; roles: RoleCode[] }> = {
  admin: { name: '系统管理员', roles: ['admin'] },
  editor: { name: '部门编辑', roles: ['editor'] },
  viewer: { name: '只读访客', roles: ['viewer'] },
}

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

export async function login(payload: LoginPayload): Promise<LoginResult> {
  if (USE_MOCK) {
    await delay(400)
    const found: { name: string; roles: RoleCode[] } | undefined = DEMO_ACCOUNTS[payload.account]
    if (!found || payload.password !== '123456') {
      throw new Error('账号或密码错误')
    }
    const profile: UserProfile = { account: payload.account, name: found.name, roles: found.roles }
    return { token: `mock-token-${payload.account}`, profile }
  }

  return http.post<LoginResult>('/auth/login', payload)
}
