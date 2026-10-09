import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import App from './App';
import './styles/global.scss';
// 把 src/icons/svg 生成的雪碧图挂到 body（htmlMode: 'none'，所以必须显式引入）
import 'virtual:svg-icons/register';

dayjs.locale('zh-cn');

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('未找到 #root 挂载节点，请检查 index.html');

createRoot(rootEl).render(
  // StrictMode：开发环境下会故意双次渲染/双次跑副作用，用来暴露“副作用不纯”的问题；
  // 生产构建不影响。Vue 没有直接对应物。
  <StrictMode>
    <App />
  </StrictMode>,
);
