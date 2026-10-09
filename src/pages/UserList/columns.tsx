import { Button, Space, Tag, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import type { UserInfo, UserStatus } from '@/api/user'

export const STATUS_MAP: Record<UserStatus, { text: string; color: string }> = {
  active: { text: '正常', color: 'success' },
  inactive: { text: '停用', color: 'default' },
  pending: { text: '待审核', color: 'processing' },
}

export function buildColumns(handlers: {
  onEdit: (row: UserInfo) => void
  onDelete: (row: UserInfo) => void
}): TableColumnsType<UserInfo> {
  const { onEdit, onDelete } = handlers

  return [
    { title: 'ID', dataIndex: 'id', width: 70, fixed: 'left' },
    {
      title: '姓名',
      dataIndex: 'name',
      width: 120,
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
    },
    { title: '邮箱', dataIndex: 'email', width: 200 },
    { title: '部门', dataIndex: 'department', width: 130 },
    { title: '角色', dataIndex: 'role', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: UserStatus) => <Tag color={STATUS_MAP[status].color}>{STATUS_MAP[status].text}</Tag>,
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 130 },
    {
      title: '登录次数',
      dataIndex: 'loginCount',
      width: 110,
      align: 'right',
      sorter: (a, b) => a.loginCount - b.loginCount,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 140,
      render: (_, row) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => onEdit(row)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => onDelete(row)}>
            删除
          </Button>
        </Space>
      ),
    },
  ]
}
