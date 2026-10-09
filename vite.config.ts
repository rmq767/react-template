import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons-ng';

/** src 目录绝对路径（正斜杠形式，Sass 也能解析） */
const toFsPath = (relative: string) =>
  fileURLToPath(new URL(relative, import.meta.url)).replace(/\\/g, '/');

const variablesPath = toFsPath('./src/styles/variables.scss');

export default defineConfig({
  plugins: [
    react(),
    // src/icons/svg 下的 svg 打包成一张雪碧图，引用方式：<svg><use href="#icon-xxx" /></svg>
    createSvgIconsPlugin({
      // 相对路径按 Vite root 解析，不必写绝对路径
      iconDirs: ['src/icons/svg'],
      // 生成 id = icon-<文件名>；需要子目录前缀时才写 icon-[dir]-[name]
      symbolId: 'icon-[name]',
      // none：不把整张图内联进 index.html（会膨胀首屏 HTML），改由 main.tsx 显式 register，
      // 雪碧图跟着 JS chunk 走，可分包可压缩
      htmlMode: 'none',
      // 把 svg 里写死的 stroke 统一改成 currentColor，暗色模式下图标才能跟随文字颜色
      strokeOverride: true,
    }),
  ],

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
          const normalized = filename.replace(/\\/g, '/');
          if (
            normalized.endsWith('styles/variables.scss') ||
            normalized.endsWith('styles/mixins.scss')
          ) {
            return content;
          }
          return `@use "${variablesPath}" as *;\n${content}`;
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
});
