import { Button, Layout, Menu, Space, Switch, Typography } from 'antd'
import { AppstoreOutlined, HomeOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useThemeStore } from '@/stores/theme'
import styles from './BasicLayout.module.scss'

const { Header, Sider, Content } = Layout

const MENU_ITEMS = [
  { key: '/', label: '技术栈总览', icon: <HomeOutlined /> },
  { key: '/users', label: '用户列表（列表页范式）', icon: <AppstoreOutlined /> },
]

export default function BasicLayout() {
  const navigate = useNavigate()
  const pathname = useLocation().pathname

  // 按需订阅：一个 selector 取一个字段，避免整个 store 变化都触发重渲染
  const dark = useThemeStore(state => state.dark)
  const collapsed = useThemeStore(state => state.collapsed)
  const toggleDark = useThemeStore(state => state.toggleDark)
  const toggleCollapsed = useThemeStore(state => state.toggleCollapsed)

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

        <Space>
          <Typography.Text type="secondary">暗色模式</Typography.Text>
          <Switch checked={dark} onChange={toggleDark} />
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
            items={MENU_ITEMS}
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
