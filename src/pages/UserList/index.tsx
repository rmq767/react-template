import { useState } from 'react'
import { App, Button, Space, Typography } from 'antd'
import { DownloadOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import SearchForm, { type FilterSchemaItem } from '@/components/SearchForm'
import PageTable from '@/components/PageTable'
import { useTableList } from '@/hooks/useTableList'
import { DEPARTMENT_OPTIONS, STATUS_OPTIONS } from '@/constants/dict'
import { deleteUser, fetchUserList, type UserInfo, type UserFilter } from '@/api/user'
import { buildColumns } from './columns'
import UserFormModal from './UserFormModal'

/**
 * ⚠️ 必须定义在组件外部：它同时是「默认值」和「URL 参数白名单」。
 * 写在组件里每次 render 都会新建对象，虽然 useTableList 内部用序列化兜住了请求，
 * 但稳定引用仍是 React 里传配置对象的基本功。
 */
const DEFAULT_FILTER: UserFilter = {
  name: '',
  department: '',
  status: '',
  dateRange: null,
}

const SCHEMA: FilterSchemaItem[] = [
  { name: 'name', label: '姓名', type: 'input' },
  { name: 'department', label: '部门', type: 'select', options: DEPARTMENT_OPTIONS },
  { name: 'status', label: '状态', type: 'select', options: STATUS_OPTIONS },
  { name: 'dateRange', label: '创建时间', type: 'dateRange' },
]

/**
 * 列表页范式：整页只有「配置」和「渲染」，没有任何请求生命周期代码。
 * loading / error / 缓存 / 翻页 / 筛选 URL 同步全部由 useTableList + TanStack Query 承担。
 */
export default function UserListPage() {
  const { message, modal } = App.useApp()
  const queryClient = useQueryClient()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<UserInfo | null>(null)

  const { filter, dataSource, loading, pagination, submitFilter, resetFilter, refetch } =
    useTableList<UserInfo, UserFilter>({
      queryKey: 'user-list',
      api: fetchUserList,
      defaultFilter: DEFAULT_FILTER,
    })

  /** 新增/编辑/删除后统一走这里，列表自动重新请求，页面不用手写 reload */
  const invalidateList = () => queryClient.invalidateQueries({ queryKey: ['user-list'] })

  const removeMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      message.success('删除成功')
      invalidateList()
    },
    onError: (error: Error) => message.error(error.message || '删除失败'),
  })

  const handleDelete = (row: UserInfo) => {
    modal.confirm({
      title: `确认删除「${row.name}」？`,
      content: '该操作不可恢复。',
      okButtonProps: { danger: true, loading: removeMutation.isPending },
      onOk: () => removeMutation.mutateAsync(row.id),
    })
  }

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (row: UserInfo) => {
    setEditing(row)
    setFormOpen(true)
  }

  // 列定义里带了交互回调，随 render 生成即可；纯静态列可以提到组件外常量避免重复创建
  const columns = buildColumns({ onEdit: openEdit, onDelete: handleDelete })

  return (
    <div className="page">
      <SearchForm
        schema={SCHEMA}
        values={filter}
        defaultValues={DEFAULT_FILTER}
        onSubmit={submitFilter}
        onReset={resetFilter}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />}>导出</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增用户
            </Button>
          </Space>
        }
      />

      <PageTable<UserInfo>
        title="用户列表"
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        scroll={{ x: 1100 }}
        extra={
          <Typography.Text type="secondary">当前页 {dataSource.length} 条</Typography.Text>
        }
      />

      <UserFormModal
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
