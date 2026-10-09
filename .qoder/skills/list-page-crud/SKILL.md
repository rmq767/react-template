---
name: list-page-crud
description: 用 React 19 + Ant Design 6 + TypeScript + @tanstack/react-query 配置驱动地新建「列表/CRUD 页」。当用户需要创建带筛选、分页、表格、新增/编辑/删除弹窗的管理后台列表页，或提到列表页、CRUD 页、把 Vue 的 MySearch/MyTable 迁移到 React 时使用此 skill。
---

# 列表页 CRUD（react-antd-starter）

以 `src/pages/UserList` 为黄金模板，配置驱动地新建一个列表页。**核心三个 hook（`useUrlFilter` / `useListQuery` / `useTableList`）不需要改**，只需新增 api 模块、页面目录、路由条目。

## 何时用

需要新建「筛选 + 表格 + 分页 + 增删改」的管理页时。对标 Vue 项目里的 `MySearch / MyTable / MyPagination` + `useSearchFilter`。

## 心智对照（Vue3 → 本项目）

- 请求生命周期（loading/error/缓存/翻页/竞态）全交给 `useTableList` + react-query，**页面里不写** `try/catch`、不写 `loading.value=...`。
- 筛选与分页写进 **URL**（不是 store），天然可分享、刷新不丢、后退还原。
- `DEFAULT_FILTER` / `SCHEMA` / `QUERY_KEY` 必须定义在**组件外**。
- 列表**不缓存**（`staleTime: 0`）：回到页面自动重拉最新 ≈ Vue keep-alive 的 `activated` 手动重拉。

## 步骤

### 1. `src/api/<entity>.ts`：类型 + 接口

```ts
import type { PageParams, PageResult } from '@/types/common'
import { http } from './request'
import { mockXxxList /* ... */ } from './mock'

export type XxxStatus = 'active' | 'inactive'

export interface XxxInfo {
  id: number
  name: string
  status: XxxStatus
  createdAt: string
}

// ⚠️ 必须用 type：interface 没有隐式索引签名，满足不了 useTableList 的泛型约束
export type XxxFilter = {
  name?: string
  status?: XxxStatus | ''
  dateRange?: [string, string] | null
}

export type XxxListParams = XxxFilter & PageParams & { startTime?: string; endTime?: string }
export type XxxFormValues = Omit<XxxInfo, 'id'>

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// 日期区间拆成 startTime/endTime 传后端，避免数组序列化歧义
function toQuery(params: XxxListParams): Record<string, unknown> {
  const { dateRange, ...rest } = params
  const [startTime, endTime] = dateRange ?? []
  return { ...rest, startTime, endTime }
}

export function fetchXxxList(params: XxxListParams) {
  if (USE_MOCK) return mockXxxList(params)
  return http.get<PageResult<XxxInfo>>('/xxxs', toQuery(params))
}
export function createXxx(values: XxxFormValues) {
  return http.post<XxxInfo>('/xxxs', values)
}
export function updateXxx(id: number, values: XxxFormValues) {
  return http.put<XxxInfo>(`/xxxs/${id}`, values)
}
export function deleteXxx(id: number) {
  return http.delete<null>(`/xxxs/${id}`)
}
```

### 2. `src/pages/<Entity>List/index.tsx`：页面

```tsx
import { useCallback, useMemo, useState } from 'react'
import { App, Button, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import SearchForm, { type FilterSchemaItem } from '@/components/SearchForm'
import PageTable from '@/components/PageTable'
import { useTableList } from '@/hooks/useTableList'
import { fetchXxxList, deleteXxx, type XxxInfo, type XxxFilter } from '@/api/xxx'
import { buildColumns } from './columns'
import XxxFormModal from './XxxFormModal'

// 配置对象必须在组件外
const QUERY_KEY = 'xxx-list'

const DEFAULT_FILTER: XxxFilter = { name: '', status: '', dateRange: null }

const SCHEMA: FilterSchemaItem[] = [
  { name: 'name', label: '名称', type: 'input' },
  { name: 'status', label: '状态', type: 'select', options: STATUS_OPTIONS },
  { name: 'dateRange', label: '创建时间', type: 'dateRange' },
]

export default function XxxListPage() {
  const { message, modal } = App.useApp()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<XxxInfo | null>(null)

  // query 用于读取错误态（isError / error / refetch）
  const { filter, dataSource, loading, pagination, submitFilter, resetFilter, query } =
    useTableList<XxxInfo, XxxFilter>({
      queryKey: QUERY_KEY,
      api: fetchXxxList,
      defaultFilter: DEFAULT_FILTER,
    })

  const invalidateList = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
    [queryClient],
  )

  const removeMutation = useMutation({
    mutationFn: deleteXxx,
    onSuccess: () => {
      message.success('删除成功')
      invalidateList()
    },
    onError: (e: Error) => message.error(e.message || '删除失败'),
  })

  // 解构 mutateAsync（引用稳定）再放依赖，避免把每次 render 都变的 mutation 塞进 deps
  const { mutateAsync: removeAsync } = removeMutation
  const handleDelete = useCallback(
    (row: XxxInfo) => {
      modal.confirm({
        title: `确认删除「${row.name}」？`,
        content: '该操作不可恢复。',
        okButtonProps: { danger: true },
        onOk: () => removeAsync(row.id),
      })
    },
    [modal, removeAsync],
  )

  const openCreate = useCallback(() => {
    setEditing(null)
    setFormOpen(true)
  }, [])
  const openEdit = useCallback((row: XxxInfo) => {
    setEditing(row)
    setFormOpen(true)
  }, [])

  // columns 作为引用传给 Table，用 useMemo 缓存；回调用 useCallback 固定
  const columns = useMemo(
    () => buildColumns({ onEdit: openEdit, onDelete: handleDelete }),
    [openEdit, handleDelete],
  )

  return (
    <div className="page">
      <SearchForm
        schema={SCHEMA}
        values={filter}
        defaultValues={DEFAULT_FILTER}
        onSubmit={submitFilter}
        onReset={resetFilter}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增
          </Button>
        }
      />

      {query.isError && (
        <div style={{ marginBottom: 12 }}>
          <Button onClick={() => query.refetch()}>加载失败，点击重试</Button>
        </div>
      )}

      <PageTable<XxxInfo>
        title="XXX 列表"
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        scroll={{ x: 1100 }}
      />

      <XxxFormModal
        open={formOpen}
        record={editing}
        onCancel={() => setFormOpen(false)}
        onSuccess={() => {
          setFormOpen(false)
          invalidateList()
        }}
      />
    </div>
  )
}
```

### 3. `src/pages/<Entity>List/columns.tsx`：纯列配置

```tsx
import { Button, Space } from 'antd'
import type { TableColumnsType } from 'antd'
import type { XxxInfo } from '@/api/xxx'

export function buildColumns(handlers: {
  onEdit: (row: XxxInfo) => void
  onDelete: (row: XxxInfo) => void
}): TableColumnsType<XxxInfo> {
  const { onEdit, onDelete } = handlers
  return [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '名称', dataIndex: 'name' },
    { title: '创建时间', dataIndex: 'createdAt', width: 160 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 140,
      render: (_, row) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => onEdit(row)}>编辑</Button>
          <Button type="link" size="small" danger onClick={() => onDelete(row)}>删除</Button>
        </Space>
      ),
    },
  ]
}
```

### 4. `src/pages/<Entity>List/XxxFormModal.tsx`：新增/编辑一体

关键点：`record === null` 即新增；Modal 会复用实例，`open` 变化时必须 `resetFields()` + `setFieldsValue()`。

```tsx
import { useEffect } from 'react'
import { App, Form, Input, Modal } from 'antd'
import { useMutation } from '@tanstack/react-query'
import { createXxx, updateXxx, type XxxFormValues, type XxxInfo } from '@/api/xxx'

const EMPTY: XxxFormValues = { name: '', status: 'active', createdAt: '' }

export interface Props {
  open: boolean
  record: XxxInfo | null
  onCancel: () => void
  onSuccess: () => void
}

export default function XxxFormModal({ open, record, onCancel, onSuccess: onSaved }: Props) {
  const { message } = App.useApp()
  const [form] = Form.useForm<XxxFormValues>()

  useEffect(() => {
    if (!open) return
    form.resetFields()
    form.setFieldsValue(record ? { ...record } : { ...EMPTY })
  }, [open, record, form])

  const submitMutation = useMutation({
    mutationFn: (values: XxxFormValues) =>
      record ? updateXxx(record.id, values) : createXxx(values),
    onSuccess: () => {
      message.success(record ? '编辑成功' : '新增成功')
      onSaved()
    },
    onError: (e: Error) => message.error(e.message || '提交失败'),
  })

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      submitMutation.mutate(values)
    } catch {
      // 校验不过，antd 已在字段下方提示，这里只需阻止提交
    }
  }

  return (
    <Modal
      title={record ? '编辑' : '新增'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okButtonProps={{ loading: submitMutation.isPending }}
    >
      <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 17 }} disabled={submitMutation.isPending}>
        <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
          <Input allowClear />
        </Form.Item>
        {/* 其余字段；Select 未选用 ''，用 getValueProps={v => ({ value: v || undefined })} 显示 placeholder */}
      </Form>
    </Modal>
  )
}
```

### 5. `src/router/access.tsx`：注册路由（菜单/路由/权限自动生效）

```tsx
{
  path: '/xxxs',
  title: 'XXX 列表',
  icon: <AppstoreOutlined />,
  roles: ['admin', 'editor'], // 不声明 = 登录即可访问
  component: lazy<ComponentType>(() => import('@/pages/XxxList')),
}
```

## 反例（不要这样写）

- ❌ 在页面里 `useState(loading)` + `useEffect(() => fetch())` 手写请求生命周期。
- ❌ 把筛选/分页塞进 zustand store（应写进 URL）。
- ❌ 删除 `useListQuery` 的 `staleTime: 0` 或 `useTableList` 的 `nonce`（会导致回到页面不刷新 / 点查询无反应）。
- ❌ `DEFAULT_FILTER`/`SCHEMA` 定义在组件内（每次 render 新引用）。
- ❌ 交互回调不做 `useCallback`、`columns` 不做 `useMemo`（本 App 未启用 React Compiler，整表会随每次 render 重建）。
- ❌ 给 `handleDelete` 依赖整个 `removeMutation` 对象（每次 render 变，击穿 memo）；应解构 `mutateAsync`。

## 验证

`pnpm typecheck` → `pnpm lint` → `pnpm build`；`pnpm dev` 手测：点查询发一次请求、翻页不闪白、重置回第一页、增删改后自动刷新、筛选写进 URL、失败有重试。
