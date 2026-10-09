import { App, Button, Card, Divider, Flex, Form, Input, Typography } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { login } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';
import type { LoginPayload } from '@/types/auth';
import styles from './index.module.scss';

const DEMO_PASSWORD = '123456';

const DEMO_ACCOUNTS = [
  { account: 'admin', desc: '全部菜单可见' },
  { account: 'editor', desc: '看不到操作日志' },
  { account: 'viewer', desc: '只能看技术栈总览' },
];

export default function LoginPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useAuthStore(state => state.token);
  const signIn = useAuthStore(state => state.signIn);
  const [form] = Form.useForm<LoginPayload>();

  // AuthGuard 用 encodeURIComponent 存的原地址；URLSearchParams.get 会自动解码
  // ⚠️ redirect 是用户可控的地址栏参数，必须限定「单个 / 开头且不以 // 开头」的站内路径：
  // ?redirect=//evil.com 会被当成跳外域，pushState 直接抛 SecurityError（登录后白屏）
  const rawRedirect = searchParams.get('redirect');
  const redirect =
    rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: result => {
      signIn(result);
      message.success(`欢迎，${result.profile.name}`);
      navigate(redirect, { replace: true });
    },
    onError: (error: Error) => message.error(error.message || '登录失败'),
  });

  // 已登录再访问登录页，直接回业务页
  if (token) {
    return <Navigate to={redirect} replace />;
  }

  return (
    <div className={styles.wrapper}>
      <Card className={styles.card}>
        <Typography.Title level={4} className={styles.title}>
          登录
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          React 19 + Ant Design 6 脚手架 · 角色权限演示
        </Typography.Paragraph>

        <Form<LoginPayload>
          form={form}
          layout="vertical"
          requiredMark={false}
          disabled={loginMutation.isPending}
          onFinish={values => loginMutation.mutate(values)}
        >
          <Form.Item
            label="账号"
            name="account"
            rules={[{ required: true, message: '请输入账号' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入账号" allowClear autoFocus />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={loginMutation.isPending}>
            登录
          </Button>
        </Form>

        <Divider plain className={styles.divider}>
          演示账号 · 密码统一 {DEMO_PASSWORD}
        </Divider>

        <Flex vertical gap={8}>
          {DEMO_ACCOUNTS.map(item => (
            <Flex key={item.account} align="center" gap={10}>
              <Typography.Text code className={styles.account}>
                {item.account}
              </Typography.Text>
              <Typography.Text type="secondary" className={styles.desc}>
                {item.desc}
              </Typography.Text>
              <Button
                size="small"
                onClick={() =>
                  form.setFieldsValue({ account: item.account, password: DEMO_PASSWORD })
                }
              >
                填入
              </Button>
            </Flex>
          ))}
        </Flex>
      </Card>
    </div>
  );
}
