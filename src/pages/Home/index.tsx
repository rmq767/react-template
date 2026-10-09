import { Alert, Card, Col, Row, Space, Tag, Typography } from 'antd';
import SvgIcon from '@/components/SvgIcon';
import styles from './index.module.scss';

interface StackItem {
  name: string;
  version: string;
  desc: string;
}

interface StackGroup {
  title: string;
  items: StackItem[];
}

const GROUPS: StackGroup[] = [
  {
    title: '基础层',
    items: [
      {
        name: 'React',
        version: '19.3',
        desc: '并发特性 + Server Components；App 未启用 Compiler，仍需手写 memo',
      },
      { name: 'TypeScript', version: '5.9', desc: 'typescript-eslint 尚不支持 TS 7，锁 5.9' },
      { name: 'Vite', version: '8.3', desc: 'dev server + 构建，@ 别名与 SCSS 变量已配好' },
      { name: 'pnpm', version: '10.x', desc: '包管理' },
    ],
  },
  {
    title: '数据层',
    items: [
      {
        name: '@tanstack/react-query',
        version: '5.104',
        desc: '服务端状态：缓存 / 竞态 / 失效 / loading 全免写',
      },
      { name: 'axios', version: '1.20', desc: '只在 api/request.ts 出现，业务里见不到它' },
      { name: 'zustand', version: '5.0', desc: '客户端 UI 状态，persist 中间件已启用' },
      {
        name: 'react-router-dom',
        version: '7.18',
        desc: 'data router + 声明式路由守卫（AuthGuard）',
      },
    ],
  },
  {
    title: '视图层',
    items: [
      { name: 'antd', version: '6.6', desc: '原生支持 React 19，样式走 CSS 变量 + Design Token' },
      { name: '@ant-design/icons', version: '6.3', desc: 'v6 必须配套 icons v6' },
      {
        name: 'vite-plugin-svg-icons-ng',
        version: '1.10',
        desc: 'src/icons/svg 雪碧图，业务私有图标走 <SvgIcon name="xxx" />',
      },
      { name: 'Sass', version: '1.105', desc: 'CSS Modules + SCSS，变量由 Vite 全局注入' },
      { name: 'clsx', version: '2.1', desc: '条件类名拼接' },
      { name: 'ahooks', version: '3.10', desc: 'useRequest / useDebounceFn 等补充工具 hook' },
    ],
  },
  {
    title: '工程层',
    items: [
      { name: 'ESLint', version: '10', desc: '扁平配置 + typescript-eslint 8 + react-hooks 7' },
      { name: 'Prettier', version: '3.9', desc: '单引号 / 带分号 / 100 列' },
      { name: 'dayjs', version: '1.11', desc: '已切 zh-cn locale，替代 moment' },
    ],
  },
];

const LAYERS = [
  ['组件内部临时状态', 'useState', '弹窗开关、表单草稿'],
  ['服务端数据', 'TanStack Query', '列表、详情、字典'],
  ['跨页面 UI 状态', 'Zustand', '主题、菜单折叠、登录用户'],
  ['可分享的页面状态', 'URL search params', '筛选条件、页码、排序'],
];

export default function HomePage() {
  return (
    <div className="page">
      <Typography.Title level={3} className={styles.title}>
        React 19 + Ant Design 6 起步脚手架
      </Typography.Title>
      <Typography.Paragraph type="secondary" className={styles.desc}>
        对照 Vue 3 + Element Plus 的技术栈迁移版本。「用户列表」是完整的列表页范式：配置驱动筛选 +
        纯展示表格 + 分页 +
        增删改后精准刷新，页面里没有一行请求生命周期代码。「操作日志」用于演示角色权限：
        不同账号登录看到的菜单不同，直接输地址访问无权限页面会被重定向到 403。
      </Typography.Paragraph>

      <Card title="状态该放哪里（迁移最容易踩的规则）" className={styles.alert}>
        <Space orientation="vertical" size={6} className={styles.layer}>
          {LAYERS.map(([scope, tool, example]) => (
            <Typography.Paragraph key={scope} className={styles.layerRow}>
              <Tag color="geekblue">{scope}</Tag>→ <Typography.Text code>{tool}</Typography.Text>
              <Typography.Text type="secondary">例：{example}</Typography.Text>
            </Typography.Paragraph>
          ))}
        </Space>
      </Card>

      <Alert
        type="info"
        showIcon
        className={styles.alert}
        title="样式分层约定"
        description="全局外观用 ConfigProvider theme.token；单个组件微调放 theme.components；命中组件内部 DOM 用语义化 classNames / styles；只有业务自有布局才写 *.module.scss。禁止用 SCSS 变量去覆盖 antd 组件配色。"
      />

      <Card title="本地图标（雪碧图）" size="small" className={styles.alert}>
        <Space size={12} align="center">
          <SvgIcon name="search" />
          <SvgIcon name="user" size={20} />
          <SvgIcon name="grid" size={24} color="var(--ant-color-primary)" />
          <Typography.Text type="secondary">
            源文件放 <Typography.Text code>src/icons/svg/</Typography.Text>，用{' '}
            <Typography.Text code>{'<SvgIcon name="search" />'}</Typography.Text> 引用；尺寸跟
            font-size，颜色默认 currentColor 所以跟随暗色切换
          </Typography.Text>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {GROUPS.map(group => (
          <Col xs={24} md={12} key={group.title}>
            <Card title={group.title} size="small" className={styles.card}>
              <Space orientation="vertical" size={10} className={styles.list}>
                {group.items.map(item => (
                  <div key={item.name} className={styles.row}>
                    <div className={styles.rowHead}>
                      <Typography.Text code>{item.name}</Typography.Text>
                      <Typography.Text type="secondary">{item.version}</Typography.Text>
                    </div>
                    <Typography.Text type="secondary" className={styles.rowDesc}>
                      {item.desc}
                    </Typography.Text>
                  </div>
                ))}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
