import { useCallback, useMemo, useState } from 'react';
import { App, Button, Space, Typography } from 'antd';
import { DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import SearchForm, { type FilterSchemaItem } from '@/components/SearchForm';
import PageTable from '@/components/PageTable';
import { useTableList } from '@/hooks/useTableList';
import { DEPARTMENT_OPTIONS, STATUS_OPTIONS } from '@/constants/dict';
import { deleteUser, fetchUserList, type UserInfo, type UserFilter } from '@/api/user';
import { buildColumns } from './columns';
// 页面私有组件放 ./components，用相对路径表明归属（不走 @/，也不加 barrel）
import UserFormModal from './components/UserFormModal';

/**
 * 必须定义在组件外部：它是筛选「默认值」兼重置目标。
 * ≈ Vue 里别把常量写在 setup 里反复重建；React 中对象每次 render 都是新引用，
 * 提到模块级才能保持引用稳定。
 */
const DEFAULT_FILTER: UserFilter = {
  name: '',
  department: '',
  status: '',
  dateRange: null,
};

const SCHEMA: FilterSchemaItem[] = [
  { name: 'name', label: '姓名', type: 'input' },
  { name: 'department', label: '部门', type: 'select', options: DEPARTMENT_OPTIONS },
  { name: 'status', label: '状态', type: 'select', options: STATUS_OPTIONS },
  { name: 'dateRange', label: '创建时间', type: 'dateRange' },
];

/** 缓存命名空间常量：传入 useTableList 与 invalidateQueries 共用，避免两处字符串漂移 */
const USER_LIST_QUERY_KEY = 'user-list';

/**
 * 列表页范式：整页只有「配置」和「渲染」，没有任何请求生命周期代码。
 * loading / error / 缓存 / 翻页 / 筛选状态全部由 useTableList + TanStack Query 承担。
 */
export default function UserListPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserInfo | null>(null);

  const { filter, dataSource, loading, pagination, submitFilter, resetFilter } = useTableList<
    UserInfo,
    UserFilter
  >({
    queryKey: USER_LIST_QUERY_KEY,
    api: fetchUserList,
    defaultFilter: DEFAULT_FILTER,
  });

  /** 新增/编辑/删除后统一走这里，列表自动重新请求，页面不用手写 reload */
  const invalidateList = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [USER_LIST_QUERY_KEY] }),
    [queryClient],
  );

  const removeMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      message.success('删除成功');
      invalidateList();
    },
    onError: (error: Error) => message.error(error.message || '删除失败'),
  });

  // mutateAsync 由 react-query 保证引用稳定，解构出来放进依赖，
  // 既不触发 exhaustive-deps 告警，又不会让 handleDelete 每次 render 变（击穿 memo）。
  const { mutateAsync: removeUserAsync } = removeMutation;

  // useCallback 把回调引用固定住，才能让下面 columns 的 useMemo 真正生效（≈ 避免每次 render 重建整表）。
  // onOk 返回 Promise 时 antd 会自动让确定按钮进入 loading，无需手动传 isPending。
  const handleDelete = useCallback(
    (row: UserInfo) => {
      modal.confirm({
        title: `确认删除「${row.name}」？`,
        content: '该操作不可恢复。',
        okButtonProps: { danger: true },
        onOk: () => removeUserAsync(row.id),
      });
    },
    [modal, removeUserAsync],
  );

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((row: UserInfo) => {
    setEditing(row);
    setFormOpen(true);
  }, []);

  // —— 对照理解：去掉 useCallback + useMemo 会怎样 ——
  // React 函数体每次 render 都从头重跑（不同于 Vue setup 只跑一次），所以：
  // ❌ 不 memo：每次 render（打开弹窗、loading 变化等）都会
  //    const openEdit = (row) => {...}       // 新函数、新引用
  //    const columns  = buildColumns({...})  // 新数组、新引用
  //    → <PageTable columns={新引用}> 判定「列变了」→ 整张表无谓重渲染。
  // ✅ 加 memo：依赖不变时跨 render 复用同一引用，表格不再重建。
  // ⚠️ 二者必须配套：columns 的依赖是 openEdit/handleDelete，若它们每次 render 都变，useMemo 也白做。
  // 列定义携带交互回调，用 useMemo 缓存：只要 openEdit/handleDelete 引用不变，整表不重建
  const columns = useMemo(
    () => buildColumns({ onEdit: openEdit, onDelete: handleDelete }),
    [openEdit, handleDelete],
  );

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
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增用户
            </Button>
            {/* 占位：导出还没实现。先置 disabled 避免被当成可用功能误点 */}
            <Button icon={<DownloadOutlined />} disabled title="TODO: 待实现导出">
              导出
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
        extra={<Typography.Text type="secondary">当前页 {dataSource.length} 条</Typography.Text>}
      />

      <UserFormModal
        open={formOpen}
        record={editing}
        onCancel={() => setFormOpen(false)}
        onSuccess={() => {
          setFormOpen(false);
          invalidateList();
        }}
      />
    </div>
  );
}
