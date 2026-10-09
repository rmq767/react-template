import { useEffect } from 'react';
import { App, DatePicker, Form, Input, Modal, Radio, Select } from 'antd';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { DEPARTMENT_OPTIONS, ROLE_OPTIONS, STATUS_OPTIONS } from '@/constants/dict';
import { createUser, updateUser, type UserFormValues, type UserInfo } from '@/api/user';

const DATE_FORMAT = 'YYYY-MM-DD';

const EMPTY_FORM: UserFormValues = {
  name: '',
  email: '',
  department: '',
  role: '',
  status: 'active',
  createdAt: '',
};

export interface UserFormModalProps {
  open: boolean;
  /** null 表示新增，非 null 表示编辑：一个组件吃掉两种模式 */
  record: UserInfo | null;
  onCancel: () => void;
  onSuccess: () => void;
}

/**
 * 新增 / 编辑弹窗。
 * 与 Vue 里「v-if 销毁重建 + defineExpose」不同，React 的 Modal 实例会被复用，
 * 所以打开时必须显式 resetFields + setFieldsValue，否则会残留上一次输入。
 */
export default function UserFormModal({
  open,
  record,
  onCancel,
  // 重命名避免与 useMutation 的 onSuccess 回调同名混淆
  onSuccess: onSaved,
}: UserFormModalProps) {
  const { message } = App.useApp();
  // Form.useForm 拿到表单实例 ≈ Vue 里给表单加个 ref，再调 form.value.xxx
  const [form] = Form.useForm<UserFormValues>();

  // ≈ watch(() => props.open)：弹窗实例会被复用，每次打开必须手动重置，否则残留上次输入
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(
      record
        ? {
            name: record.name,
            email: record.email,
            department: record.department,
            role: record.role,
            status: record.status,
            createdAt: record.createdAt,
          }
        : { ...EMPTY_FORM, createdAt: dayjs().format(DATE_FORMAT) },
    );
  }, [open, record, form]);

  const submitMutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      record ? updateUser(record.id, values) : createUser(values),
    onSuccess: () => {
      message.success(record ? '编辑成功' : '新增成功');
      onSaved();
    },
    onError: (error: Error) => message.error(error.message || '提交失败'),
  });

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      submitMutation.mutate(values);
    } catch {
      // 校验不通过时 antd 已在字段下方显示错误，这里只需要阻止提交
    }
  };

  return (
    <Modal
      title={record ? `编辑用户 - ${record.name}` : '新增用户'}
      open={open}
      width={560}
      okText="保存"
      onCancel={onCancel}
      onOk={handleOk}
      okButtonProps={{ loading: submitMutation.isPending }}
    >
      <Form
        form={form}
        labelCol={{ span: 5 }}
        wrapperCol={{ span: 17 }}
        disabled={submitMutation.isPending}
      >
        <Form.Item
          label="姓名"
          name="name"
          rules={[
            { required: true, message: '请输入姓名' },
            { max: 20, message: '姓名不超过 20 个字符' },
          ]}
        >
          <Input allowClear placeholder="请输入姓名" />
        </Form.Item>

        <Form.Item
          label="邮箱"
          name="email"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '邮箱格式不正确' },
          ]}
        >
          <Input allowClear placeholder="请输入邮箱" />
        </Form.Item>

        <Form.Item
          label="部门"
          name="department"
          rules={[{ required: true, message: '请选择部门' }]}
          // store 里存 ''（保证类型与提交载荷干净），控件吃 undefined 才能渲染出 placeholder
          getValueProps={value => ({ value: value || undefined })}
        >
          <Select placeholder="请选择部门" options={DEPARTMENT_OPTIONS} />
        </Form.Item>

        <Form.Item
          label="角色"
          name="role"
          rules={[{ required: true, message: '请选择角色' }]}
          getValueProps={value => ({ value: value || undefined })}
        >
          <Select placeholder="请选择角色" options={ROLE_OPTIONS} />
        </Form.Item>

        <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
          <Radio.Group options={STATUS_OPTIONS} optionType="button" buttonStyle="solid" />
        </Form.Item>

        <Form.Item
          label="创建时间"
          name="createdAt"
          rules={[{ required: true, message: '请选择创建时间' }]}
          // store 存字符串、控件收 Dayjs：写入前 normalize，渲染时 getValueProps 反向转换
          normalize={value => (value ? value.format(DATE_FORMAT) : '')}
          getValueProps={value => ({ value: value ? dayjs(value) : null })}
        >
          <DatePicker style={{ width: '100%' }} allowClear={false} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
