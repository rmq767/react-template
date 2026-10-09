import type { LoginPayload, LoginResult, RoleCode, UserProfile } from '@/types/auth';
import { http } from './request';
import { delay, USE_MOCK } from './env';

/**
 * 演示账号，密码统一 123456。
 * 三个角色分别对应「全部可见 / 部分可见 / 只读」，方便验证菜单过滤与 403 拦截。
 */
const DEMO_ACCOUNTS: Record<string, { name: string; roles: RoleCode[] }> = {
  admin: { name: '系统管理员', roles: ['admin'] },
  editor: { name: '部门编辑', roles: ['editor'] },
  viewer: { name: '只读访客', roles: ['viewer'] },
};

export async function login(payload: LoginPayload): Promise<LoginResult> {
  if (USE_MOCK) {
    await delay(400);
    // ⚠️ 用 Object.hasOwn 而不是直接下标取：`DEMO_ACCOUNTS['constructor']` 这类 key 会命中
    // 原型链上的函数（truthy），让 `!found` 判空失效，产出一个 name/roles 都是 undefined 的「登录成功」
    const found: { name: string; roles: RoleCode[] } | undefined = Object.hasOwn(
      DEMO_ACCOUNTS,
      payload.account,
    )
      ? DEMO_ACCOUNTS[payload.account]
      : undefined;
    if (!found || payload.password !== '123456') {
      throw new Error('账号或密码错误');
    }
    const profile: UserProfile = { account: payload.account, name: found.name, roles: found.roles };
    return { token: `mock-token-${payload.account}`, profile };
  }

  return http.post<LoginResult>('/auth/login', payload);
}
