import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** src 目录绝对路径（正斜杠形式，Sass 也能解析） */
const toFsPath = (relative: string) =>
  fileURLToPath(new URL(relative, import.meta.url)).replace(/\\/g, '/')

const variablesPath = toFsPath('./src/styles/variables.scss')

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        // 全局注入设计变量，业务 .scss 文件里不用再手写 @use
        // 用绝对路径而非 "@/" 别名：Sass 不识别 Vite 的 resolve.alias
        additionalData: (content: string, filename: string) => {
          const normalized = filename.replace(/\\/g, '/')
          if (normalized.endsWith('styles/variables.scss') || normalized.endsWith('styles/mixins.scss')) {
            return content
          }
          return `@use "${variablesPath}" as *;\n${content}`
        },
      },
    },
  },

  server: {
    port: 5173,
    // 有真实后端时打开代理，并把 VITE_API_BASE_URL 设为 /api
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // Vite 8 底层换成 Rolldown，manualChunks 的对象写法已不支持，
        // 分包改用 advancedChunks.groups（按正则匹配模块路径）
        advancedChunks: {
          groups: [
            { name: 'react', test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/ },
            { name: 'antd', test: /node_modules[\\/](?:antd|@ant-design|@rc-component)[\\/]/ },
            { name: 'data', test: /node_modules[\\/](?:@tanstack|axios)[\\/]/ },
            { name: 'vendor', test: /node_modules[\\/]/ },
          ],
        },
      },
    },
  },
})
