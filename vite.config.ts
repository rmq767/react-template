import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons-ng';

/** 转成 POSIX 分隔符的绝对路径（正斜杠，Sass 的 loadPaths 也吃这个格式） */
const toFsPath = (relative: string) =>
  fileURLToPath(new URL(relative, import.meta.url)).replace(/\\/g, '/');

const stylesDir = toFsPath('./src/styles');

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
        // 必须用 loadPaths + 裸模块名：@use 里写绝对路径时 sass 会把路径当 URL 解析，
        // 项目目录含中文（后台模板）会导致 "Can't find stylesheet to import"，
        // 而 "@/" 别名 Sass 又不识别，所以只能靠 loadPaths 定位
        loadPaths: [stylesDir],
        additionalData: (content: string, filename: string) => {
          const normalized = filename.replace(/\\/g, '/');
          if (
            normalized.endsWith('styles/variables.scss') ||
            normalized.endsWith('styles/mixins.scss')
          ) {
            return content;
          }
          return `@use "variables" as *;\n${content}`;
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
