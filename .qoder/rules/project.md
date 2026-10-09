---
trigger: always_on
---
# 项目规则 · react-antd-starter

面向 **Vue3 + TypeScript + Element Plus** 背景同学。新增/修改代码前遵守本文件；本文件与 `README.md` 冲突时，以本文件的技术栈基线为准、以代码实际行为为准。

## 1. 技术栈基线（唯一真相 = `package.json`）

- React **19.3** / react-dom 19.3 / TypeScript **5.9**（**禁止**升 7.x，`typescript-eslint` 要求 `typescript < 6.1.0`）
- Ant Design **6.6** + `@ant-design/icons` **6.3**（v6 必须配套 icons v6）
- react-router-dom **7.18**（data router `createBrowserRouter`）
- @tanstack/react-query **5.104**、zustand **5**、axios **1.20**、dayjs **1.11**（已切 `zh-cn`）
- 构建 **Vite 8（Rolldown）**，包管理 pnpm 10，Node `>=22.12`
- **禁止**出现「React 18 / router v6」表述，禁止建议降级。
- App 层**未启用 React Compiler**，`useMemo/useCallback` 仍需手写。

## 2. 命名与目录约定

| 类别 | 规则 | 示例 |
| --- | --- | --- |
| React 组件文件 / 页面目录 | PascalCase | `BasicLayout.tsx`、`pages/UserList/`、`components/SearchForm/` |
| 目录入口"桶文件" | 小写 `index.tsx` | `components/SearchForm/index.tsx` |
| Hook 文件 | camelCase，`use` 前缀 | `useTableList.ts`、`useUrlFilter.ts` |
| 非组件工具/接口/状态模块 | 小写 | `api/request.ts`、`stores/auth.ts`、`constants/dict.ts` |
| 含 JSX 的辅助文件 | 小写也允许，但导出的是函数则保持小写 | `pages/UserList/columns.tsx`（`buildColumns` 返回列配置） |
| api 函数 | 动词开头 | `fetchXxxList` / `createXxx` / `updateXxx` / `deleteXxx` |
| CSS Module 类名 | **camelCase** | `.searchForm`、`.actions`（Vite 默认 `localsConvention: camelCase`，kebab 也能用但统一写 camelCase） |

目录职责边界：`api`（接口+类型）/ `components`（可复用组件）/ `hooks`（逻辑）/ `pages/<PascalCase>`（页面）/ `router`（路由与权限源）/ `stores`（zustand UI 状态）/ `styles`（全局 SCSS 变量与 mixin）/ `types`（共享类型）/ `constants`（业务字典）。

## 3. 状态分层（迁移最易踩，务必遵守）

| 状态类型 | 归位 | 例子 |
| --- | --- | --- |
| 组件内部临时状态 | `useState` | 弹窗开关、表单草稿 |
| 服务端数据 | TanStack Query | 列表、详情、字典 |
| 跨页面 UI 状态 | Zustand | 主题、菜单折叠、登录用户 |
| 可分享的页面状态 | **URL search params** | 筛选条件、页码 |

- 筛选/分页**不进 store**，写进 URL：可分享、刷新不丢、后退还原；写 URL 统一 `replace: true`。
- 业务数据**不进** store / URL，一律走 react-query。

## 4. 样式分层（优先级从高到低）

1. `ConfigProvider theme.token`（主色/圆角/字号）
2. `ConfigProvider theme.components`（单组件微调，如 `Table.headerBg`）
3. 组件 `classNames` / `styles`（命中内部 DOM）
4. `*.module.scss`（业务自有布局）
5. `:global(.ant-xxx)`（兜底，克制）

**禁止**用 SCSS 变量覆盖 antd 组件配色（会破坏暗色）。要颜色直接用 `var(--ant-*)`；注意 antd v6 默认以 CSS Variables 输出 token，变量挂在 `.ant-app` 子树，业务 SCSS 用 `var(--ant-*)` 必须位于 `ConfigProvider` 内。SCSS 全局变量由 `vite.config.ts` 用绝对路径注入（`@/` 别名对 Sass 无效）。

## 5. 列表页范式（强制）

- 列表页必须走 `useTableList + SearchForm + PageTable`；**页面内不得写任何请求生命周期**（loading/try-catch/reload）。
- `useTableList` 已分层：`useUrlFilter`（URL↔状态）+ `useListQuery`（react-query）+ 门面。加新列表页**不改**核心 hook。
- 列表**不缓存**：`useListQuery` 里 `staleTime: 0`（数据实时；全局默认 30s 只留给详情/字典）。
- `nonce` 表达「一次显式查询动作」：点查询/重置自增，即使筛选没变也发一次请求。**不要删除**。
- 增/改/删成功后：`queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })`；`QUERY_KEY` 用模块级常量，传入 hook 与 invalidate 共用，避免字符串漂移。
- 列表错误：`query.isError` 时用 `Alert` 提示 + 「重试」按钮。

## 6. 关键坑（改动前必读，与 README 第八节一致）

1. 泛型约束 `TFilter extends Record<string, unknown>` 要求筛选项类型用 **`type`** 而非 `interface`。
2. `DEFAULT_FILTER` / `SCHEMA` 等配置对象**必须定义在组件外**。
3. Select 的 placeholder 只在值为 `undefined`/`null` 时出现；项目用 `''` 表示未选，控件层用 `value={v || undefined}` / `getValueProps` 转换。
4. DatePicker 与字符串：store 存 `YYYY-MM-DD`，用 `normalize` + `getValueProps` 与 Dayjs 双向转换。
5. antd Modal 实例会复用（不像 Vue `v-if` 销毁重建）：`open` 变化时必须 `resetFields()` + `setFieldsValue()`。
6. 交互回调要传给 `columns`/子组件时：回调用 `useCallback`、`columns` 用 `useMemo`；依赖 `useMutation` 的回调请解构 `mutateAsync`（引用稳定）再放依赖，别把每次 render 都变的 mutation 对象塞进 deps。

## 7. 验证清单（提交前）

- `pnpm typecheck` → `pnpm lint`（0 error，尽量 0 warning）→ `pnpm build`。
- 手测列表页（`admin/123456`）：①点查询发一次请求（筛选不变也发）；②翻页旧数据不闪白；③重置清空回第一页；④增/改/删后 invalidate 自动刷新；⑤改筛选 URL 同步、刷新不丢、后退还原；⑥`editor` 手输 `/audit` 跳 403；⑦暗色切换跟随。

## 8. 语言与注释约定

- 注释用中文，力求简短；**只在 React 认知门槛处**加一行 `≈ Vue: xxx` 对照，避免刷屏。
- 遵循 Prettier：单引号 / 无分号 / 100 列。
