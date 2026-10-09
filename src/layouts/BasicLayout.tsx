import { App, Avatar, Button, Dropdown, Layout, Menu, Space, Switch, Typography } from 'antd'
import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAccess } from '@/hooks/useAccess'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import styles from './BasicLayout.module.scss'

const { Header, Sider, Content } = Layout

export default function BasicLayout() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const pathname = useLocation().pathname

  // 按需订阅：一个 selector 取一个字段，避免整个 store 变化都触发重渲染
  const dark = useThemeStore(state => state.dark)
  const collapsed = useThemeStore(state => state.collapsed)
  const toggleDark = useThemeStore(state => state.toggleDark)
  const toggleCollapsed = useThemeStore(state => state.toggleCollapsed)
  const profile = useAuthStore(state => state.profile)
  const signOut = useAuthStore(state => state.signOut)

  // 菜单直接来自「权限过滤后的路由表」：
  // 没权限的页面既不出现在菜单，也进不去（AuthGuard 会重定向 403），两者天然一致
  const { menuItems } = useAccess()

  const handleLogout = () => {
    signOut()
    message.success('已退出登录')
    navigate('/login', { replace: true })
  }

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <Space size="middle">
          <Button
            type="text"
            aria-label="切换菜单"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsed}
          />
          <Typography.Text strong className={styles.title}>
            React 19 + Ant Design 6 Starter
          </Typography.Text>
        </Space>

        <Space size="middle">
          <Typography.Text type="secondary">暗色模式</Typography.Text>
          <Switch checked={dark} onChange={toggleDark} />

          <Dropdown
            menu={{
              items: [
                {
                  key: 'account',
                  disabled: true,
                  label: `角色：${(profile?.roles ?? []).join(' / ') || '-'}`,
                },
                { type: 'divider' },
                { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: handleLogout },
              ],
            }}
          >
            <Space className={styles.user}>
              <Avatar size="small">{profile?.name?.slice(0, 1)}</Avatar>
              <Typography.Text>{profile?.name}</Typography.Text>
            </Space>
          </Dropdown>
        </Space>
      </Header>

      <Layout className={styles.body}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={toggleCollapsed}
          theme={dark ? 'dark' : 'light'}
          width={220}
          /* 关掉 Sider 自带触发条（其配色不跟随 darkAlgorithm），统一用 Header 里的折叠按钮 */
          trigger={null}
          className={styles.sider}
        >
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
        </Sider>

        <Content className={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
