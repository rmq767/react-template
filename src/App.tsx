import { useEffect } from 'react';
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { bindErrorNotify } from '@/api/request';
import { useThemeStore } from '@/stores/theme';

// QueryClient 必须建在组件外部（模块级单例），否则会随每次 render 重建、缓存全丢。
// ≈ Vue 里在全局 new 一个 QueryClient 后 app.use 注入。
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 全局默认：详情/字典等可受益于短时缓存。
      // 列表页需实时，在 useListQuery 里单独覆盖为 staleTime: 0。
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * 桥接组件：自己渲染 null，只把 `App.useApp()` 的 message 实例交给 axios 响应拦截器。
 * 拦截器跑在组件外，拿不到 hook，只能由组件主动递进来（≈ Vue 里把全局方法挂到 app.config.globalProperties）。
 */
function ErrorNotifyBridge() {
  const { message } = AntdApp.useApp();

  useEffect(() => bindErrorNotify(content => message.error(content)), [message]);

  return null;
}

export default function App() {
  const dark = useThemeStore(state => state.dark);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        // 暗色只切算法，业务 CSS 里的 var(--ant-*) 自动跟着变，不需要写第二套样式
        algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        // antd v6 已默认以纯 CSS Variables 输出 token（无需再配 cssVar）；变量挂在 .ant-app 子树，业务 SCSS 用 var(--ant-*) 须在 ConfigProvider 内
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
      {/* Provider 链≈ Vue 的 app.use(...) 叠加全局上下文：ConfigProvider=主题/locale，AntdApp=可拿 message/modal 的 context，QueryClientProvider=数据缓存 */}
      <AntdApp>
        {/* 组件外只能拿到静态 message（不跟随主题），所以由这里把 context 版递给拦截器 */}
        <ErrorNotifyBridge />
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  );
}
