/** 角色编码：菜单过滤与路由守卫都以它为准 */
export type RoleCode = 'admin' | 'editor' | 'viewer'

/**
 * ⚠️ 本文件统一用 type 而不是 interface：
 * interface 没有隐式索引签名，无法赋给 http.post(url, data: Record<string, unknown>)。
 * 项目里的 UserFilter / UserFormValues 同理，遵循同一个约定。
 */
export type UserProfile = {
  account: string
  name: string
  roles: RoleCode[]
}

export type LoginPayload = {
  account: string
  password: string
}

export type LoginResult = {
  token: string
  profile: UserProfile
}
