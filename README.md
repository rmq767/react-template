# React 19 + Ant Design 6 起步脚手架

面向 **Vue 3 + TypeScript + Element Plus** 背景同学的 React 迁移样板。项目不含 Tailwind、不含运行时 CSS-in-JS，样式完全交给 antd Design Token + CSS Modules(SCSS)。

---

## 一、技术栈

| 层次 | 选型 | 版本 | 说明 |
| --- | --- | --- | --- |
| 框架 | React | 19.3.0 | 并发特性，Compiler 已在 antd dist 产物中启用 |
| 语言 | TypeScript | 5.9.3 | **不能升 7.x**：`typescript-eslint` 要求 `typescript <6.1.0` |
| 构建 | Vite | 8.3.4 | 底层已是 Rolldown |
| UI | Ant Design | 6.6.5 | v6 原生支持 React 19，无需 `@ant-design/v5-patch-for-react-19` |
| 图标 | @ant-design/icons | 6.3.4 | antd v6 必须配套 icons v6 |
| 路由 | react-router-dom | 7.18.4 | data router（`createBrowserRouter`） |
| 服务端状态 | @tanstack/react-query | 5.104.1 | 列表/详情的 loading、error、缓存、竞态 |
| 客户端状态 | zustand | 5.0.15 | 仅 UI 状态，已启用 `persist` |
| HTTP | axios | 1.20.0 | 只在 `src/api/request.ts` 出现 |
| 样式 | Sass (CSS Modules) | 1.105.1 | `*.module.scss`，零运行时 |
| 辅助 | ahooks / clsx / dayjs | 3.10 / 2.1.1 / 1.11 | dayjs 已切 `zh-cn` locale |
| 规范 | ESLint 10 + typescript-eslint 8 + Prettier 3.9 | — | ESLint 扁平配置 |

### 刻意没有引入的东西

- **Tailwind CSS**：团队反馈维护体验差，样式统一走 antd token。
- **styled-components / Emotion**：运行时 CSS-in-JS 有性能开销，且与 React Server Components 不兼容。
- **Redux Toolkit**：本项目规模下 Zustand 足够，复杂全局状态需求出现时再评估。
- **Next.js**：纯中后台 SPA，无 SEO / SSR 需求。
- **moment**：antd v5+ 起内部使用 dayjs。

---

## 二、快速开始

```powershell
pnpm install

pnpm dev         # http://127.0.0.1:5173
pnpm build       # tsc --noEmit && vite build
pnpm preview     # 预览构建产物
pnpm typecheck   # 仅类型检查
pnpm lint        # ESLint
pnpm lint:fix
pnpm format      # Prettier
```

环境要求：Node `>=22.12`（Vite 8 要求）、pnpm 10。

---

## 三、目录结构

```
src/
├── api/
│   ├── request.ts        # axios 实例 + 业务码解包 + token 注入，唯一出现 axios 的地方
│   ├── auth.ts           # 登录接口（含三个演示账号）
│   ├── user.ts           # 接口定义 + 类型（UserInfo / UserFilter / UserFormValues）
│   └── mock.ts           # 内存 mock，供无后端时演示
├── components/
│   ├── SearchForm/       # 配置驱动筛选表单（input / select / dateRange）
│   └── PageTable/        # 纯展示表格，不碰数据加载
├── constants/dict.ts     # 业务字典：部门、角色、状态（筛选项与 mock 数据同源）
├── hooks/
│   ├── useTableList.ts   # 列表页核心：筛选 + 分页 + 请求三合一
│   └── useAccess.ts      # 角色判断 + 过滤后的菜单数据
├── layouts/BasicLayout.tsx
├── pages/
│   ├── Login/            # 登录页（布局外，独立整页）
│   ├── Home/             # 技术栈总览
│   ├── UserList/         # 列表页范式（含新增/编辑弹窗）
│   ├── Audit/            # 操作日志（仅 admin，权限演示用）
│   ├── Forbidden/        # 403
│   └── NotFound/         # 404
├── router/
│   ├── access.tsx        # ⭐ 菜单与路由的唯一数据源（含 roles 声明）
│   ├── AuthGuard.tsx     # 声明式路由守卫
│   └── index.tsx         # 由 ACCESS_ROUTES 派生路由表
├── stores/
│   ├── auth.ts           # 登录态（persist），getAccessToken 供 axios 用
│   └── theme.ts          # 暗色 + 菜单折叠
├── styles/               # variables.scss / mixins.scss / global.scss
├── types/                # common.ts（分页/响应）+ auth.ts（角色/登录）
└── App.tsx               # ConfigProvider + QueryClientProvider + RouterProvider
```

---

## 四、两条最重要的约定

### 1. 状态放哪里（迁移最容易踩的规则）

| 状态类型 | 放哪里 | 例子 |
| --- | --- | --- |
| 组件内部临时状态 | `useState` | 弹窗开关、表单草稿 |
| 服务端数据 | TanStack Query | 列表、详情、字典 |
| 跨页面 UI 状态 | Zustand | 主题、菜单折叠、登录用户 |
| 可分享的页面状态 | **URL search params** | 筛选条件、页码、排序 |

筛选和分页**不进 store**，直接写进 URL：链接可分享、刷新不丢、浏览器前进后退天然可用。这是 React 中后台相对 Vue 项目最明显的思路差异。

### 2. 样式分层（优先级从高到低）

| 层级 | 手段 | 用途 |
| --- | --- | --- |
| 1 | `ConfigProvider theme.token` | 主色、圆角、字号等全局外观 |
| 2 | `ConfigProvider theme.components` | 单个组件微调，如 `Table.headerBg` |
| 3 | 组件的 `classNames` / `styles` | 命中组件内部 DOM（v6 已全组件语义化） |
| 4 | `*.module.scss` | 业务自有布局 |
| 5 | `:global(.ant-xxx)` | 兜底，尽量克制 |

**禁止**用 SCSS 变量覆盖 antd 组件配色——antd v6 是运行时 token 体系，写死 SCSS 颜色会导致暗色模式失效。业务 SCSS 需要颜色时直接用 `var(--ant-color-text)` 这类变量，暗色切换会自动跟随。

---

## 五、列表页范式

`src/pages/UserList/index.tsx` 是一个完整 CRUD 样板，整页没有一行请求生命周期代码：

```tsx
const { filter, dataSource, loading, pagination, submitFilter, resetFilter, refetch } =
  useTableList<UserInfo, UserFilter>({
    queryKey: 'user-list',
    api: fetchUserList,
    defaultFilter: DEFAULT_FILTER,
  })
```

- **查询**：`SearchForm` 内部维护草稿，点「查询」才提交到 URL 触发请求（输入不会疯狂请求）。查询按钮不显示 loading，加载态由表格承担。
- **翻页**：`keepPreviousData` 保证翻页时旧数据不闪白。
- **新增/编辑**：同一个 `UserFormModal` 组件，`record === null` 即新增模式。
- **删除/提交后刷新**：`queryClient.invalidateQueries({ queryKey: ['user-list'] })`，不手写 reload。

---

## 六、登录与角色权限

演示账号（密码统一 `123456`）：

| 账号 | 角色 | 可见菜单 |
| --- | --- | --- |
| `admin` | admin | 技术栈总览 / 用户列表 / 操作日志 |
| `editor` | editor | 技术栈总览 / 用户列表（手输 `/audit` 跳 403） |
| `viewer` | viewer | 仅技术栈总览（`/users`、`/audit` 都跳 403） |

**单一数据源**：`src/router/access.tsx` 里的 `ACCESS_ROUTES` 同时驱动三件事——路由表、左侧菜单、权限判断，因此不会出现「菜单藏了但路由还能直连」这种不一致。

```tsx
{
  path: '/audit',
  title: '操作日志',
  icon: <AuditOutlined />,
  roles: ['admin'], // 不声明 = 登录即可访问；声明 = 拥有其中任一角色才可进
  component: lazy<ComponentType>(() => import('@/pages/Audit')),
}
```

**新增一个带权限的页面只需两步**：① 在 `ACCESS_ROUTES` 加一条（写好 `roles`）；② 建页面组件。菜单、路由、拦截自动生效。

**守卫方式**：React Router 没有 Vue 的全局 `beforeEach`，改用声明式组件 `AuthGuard` 包裹每个路由元素：未登录 → `/login?redirect=原地址`（登录后自动跳回，含 query）；角色不符 → `/403`。按钮级粒度用 `useAccess().can(['admin'])` 判断。

**登录态存储**：Zustand + `persist`（localStorage key `app-auth`），F5 刷新不掉登录；axios 通过 `getAccessToken()` 读取并注入 `Authorization` 头。`/403` 与 `/404` 故意放在布局外，避免未登录时被外层守卫二次拦截产生歧义。

---

## 七、Vue 3 → React 概念对照

| Vue 3 | React（本项目） |
| --- | --- |
| `ref` / `reactive` | `useState`（不可变，需整体替换） |
| `computed` | 直接派生计算，重计算才 `useMemo` |
| `watch` / `watchEffect` | `useEffect`（依赖数组 + 清理函数） |
| `<style scoped>` | **CSS Modules**（React 没有 scoped，必须靠 `.module.scss`） |
| Pinia | Zustand |
| vue-router | React Router v7 |
| Element Plus SCSS 变量主题 | antd `ConfigProvider` token（运行时） |
| 具名插槽 / `v-slot` | `ReactNode` 类型的 prop（见 `SearchForm` 的 `extra`） |
| `defineExpose` + 父组件调用 | 状态提升到父组件，用 `open` / `record` props 控制 |
| MySearch / MyTable / MyPagination | `SearchForm` + `PageTable` + `useTableList` |

---

## 八、已踩过的坑（改动前请先读）

1. **SCSS 全局变量注入不能用 `@/` 别名**：Sass 不认识 Vite 的 `resolve.alias`，`vite.config.ts` 里用绝对路径注入，并排除了 `variables.scss` 自身避免自引用。业务 SCSS 里若要 `mixins.scss`，需手动 `@use` 相对路径。
2. **Vite 8 分包配置换成 `advancedChunks`**：`manualChunks` 的对象写法在 Rolldown 下静默失效（表现为所有依赖挤进一个 chunk）。
3. **泛型约束要求 `type` 而非 `interface`**：`TFilter extends Record<string, unknown>` 无法接受 interface（没有隐式索引签名），见 `api/user.ts` 的 `UserFilter`。
4. **配置对象必须定义在组件外**：`DEFAULT_FILTER`、`SCHEMA` 若写在组件内，每次 render 都是新引用。
5. **Modal 实例会被复用**：不像 Vue 的 `v-if` 销毁重建，必须在 `open` 变化时 `resetFields()` + `setFieldsValue()`，否则残留上次输入。
6. **antd CSS 变量挂在 `.ant-app` 而非 `:root`**：业务 SCSS 使用 `var(--ant-*)` 必须位于 `ConfigProvider` 子树内。
7. **Sider 自带折叠触发条不跟随暗色算法**：本项目设 `trigger={null}`，折叠统一走 Header 按钮。
8. **DatePicker 与字符串值**：表单 store 存 `YYYY-MM-DD` 字符串，通过 `normalize` + `getValueProps` 与控件的 Dayjs 双向转换。
9. **Select 的 placeholder 只在值为 `undefined`/`null` 时出现**：本项目用空字符串 `''` 表示「未选」（便于 URL 与提交载荷保持一致），而 antd 会把 `''` 当成「选中了一个不存在的选项」渲染成空白。因此搜索区用 `value={v || undefined}`、弹窗表单用 `getValueProps={v => ({ value: v || undefined })}` 在控件层做一次转换。新增下拉控件时注意同一个坑。
10. **「只有内容区滚动」需要三个条件同时成立**：外层 Layout 用 `height: 100vh`（用 `min-height` 会被内容撑高，变成整页滚动、Header/Sider 跟着跑）+ 内层 Layout 显式 `min-height: 0`（flex 子项默认 `min-height: auto`，不归零就不会产生内部滚动）+ Content 自身 `overflow: auto`。见 `src/layouts/BasicLayout.module.scss`。
11. **业务页面不限最大宽度**：`.page` 只留 padding，宽度铺满内容区（需求明确不要 1440 封顶）。需要限宽时在具体页面自己加，不要放进全局类。

---

## 九、接真实后端

1. `.env.development` 设 `VITE_USE_MOCK=false`，`VITE_API_BASE_URL=/api`；
2. `vite.config.ts` 的 `server.proxy['/api'].target` 改成后端地址；
3. 按后端实际字段调整 `src/api/request.ts` 的 `unwrap`（当前约定 `code === 0` 为成功）；
4. `src/api/auth.ts` 关掉 mock 分支走 `/auth/login`；若后端是「只给 token、用户信息需事后再拉」的模式，把拉取 profile 放到路由 `loader` 里，避免首屏 roles 为空导致误跳 403；
5. 删除 `src/api/mock.ts`。

后端返回结构约定：

```json
{ "code": 0, "message": "ok", "data": { "list": [], "total": 0 } }
```
