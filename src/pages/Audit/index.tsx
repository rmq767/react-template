import { Card, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'

interface AuditLog {
  id: number
  operator: string
  action: string
  target: string
  ip: string
  createdAt: string
}

const DATA: AuditLog[] = [
  { id: 1, operator: '系统管理员', action: '删除用户', target: '王勇 (ID 12)', ip: '10.12.3.44', createdAt: '2026-10-09 10:22' },
  { id: 2, operator: '部门编辑', action: '编辑用户', target: '李芳 (ID 17)', ip: '10.12.3.51', createdAt: '2026-10-09 09:48' },
  { id: 3, operator: '系统管理员', action: '调整角色', target: '赵洋 → 审计', ip: '10.12.3.44', createdAt: '2026-10-08 18:05' },
  { id: 4, operator: '只读访客', action: '导出报表', target: '2026-09 汇总', ip: '10.12.7.9', createdAt: '2026-10-08 16:31' },
  { id: 5, operator: '系统管理员', action: '新增用户', target: '测试员A (ID 1000)', ip: '10.12.3.44', createdAt: '2026-10-08 11:12' },
]

const COLUMNS: TableColumnsType<AuditLog> = [
  { title: 'ID', dataIndex: 'id', width: 70 },
  { title: '操作人', dataIndex: 'operator', width: 120 },
  {
    title: '动作',
    dataIndex: 'action',
    width: 120,
    render: (action: string) => <Tag color="blue">{action}</Tag>,
  },
  { title: '对象', dataIndex: 'target' },
  { title: 'IP', dataIndex: 'ip', width: 130 },
  { title: '时间', dataIndex: 'createdAt', width: 170 },
]

/** 仅 admin 可见的演示页：用来验证菜单过滤与直接改地址时的 403 拦截 */
export default function AuditPage() {
  return (
    <div className="page">
      <Card title="操作日志（仅管理员角色可见）">
        <Table<AuditLog> rowKey="id" columns={COLUMNS} dataSource={DATA} pagination={false} size="middle" />
      </Card>
    </div>
  )
}
