import { Button, Space, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import type { UserInfo, UserStatus } from '@/api/user';
import { STATUS_LABELS } from '@/constants/dict';

/** 只存色板：文案统一取 constants/dict 的 STATUS_LABELS，不留第二份真相 */
const STATUS_COLORS: Record<UserStatus, string> = {
  active: 'success',
  inactive: 'default',
  pending: 'processing',
};

export function buildColumns(handlers: {
  onEdit: (row: UserInfo) => void;
  onDelete: (row: UserInfo) => void;
}): TableColumnsType<UserInfo> {
  const { onEdit, onDelete } = handlers;

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
      render: (status: UserStatus) => (
        // 类型上的 Record 保证不了运行时：后端扩枚举或返回脏数据时，这里取不到值不能让整表崩
        <Tag color={STATUS_COLORS[status] ?? 'default'}>{STATUS_LABELS[status] ?? status}</Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 130 },
    {
      title: '登录次数',
      dataIndex: 'loginCount',
      width: 110,
      align: 'right',
      // 不写客户端 sorter：列表是服务端分页，sorter 只能排「当前页这 10 条」，跨页结果是错的。
      // 要全局排序就把 sortField/sortOrder 放进 UserFilter 交给后端（配 antd 的 onChange 取排序信息）。
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
  ];
}
