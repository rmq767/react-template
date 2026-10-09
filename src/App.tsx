import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { useThemeStore } from '@/stores/theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  const dark = useThemeStore(state => state.dark)

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        // 暗色只切算法，业务 CSS 里的 var(--ant-*) 自动跟着变，不需要写第二套样式
        algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        // antd v6 已默认以纯 CSS Variables 输出样式，业务 SCSS 直接复用同一套 token，无需再配 cssVar
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
          fontSize: 14,
        },
        // 组件级微调：优先级高于全局 token，仍不需要写 CSS
        components: {
          Table: { headerBg: dark ? '#1d1d1d' : '#fafafa' },
        },
      }}
    >
      {/* AntdApp 提供 context 版 message/modal，静态方法拿不到主题 */}
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  )
}
