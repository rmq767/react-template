import type { CSSProperties, ReactElement } from 'react';
import { clsx } from 'clsx';
import iconIds from 'virtual:svg-icons/ids';
import styles from './index.module.scss';

export interface SvgIconProps {
  /** src/icons/svg 下的文件名（不含 .svg），对应雪碧图 id `icon-<name>` */
  name: string;
  /** 尺寸走 font-size 倍数：默认 1em，跟父级字号联动（与 antd 图标同一套思路） */
  size?: number | string;
  /** 颜色默认 currentColor，跟随文字色 / 暗色主题 */
  color?: string;
  /** 旋转动画，用于 loading 类图标 */
  spin?: boolean;
  /** 有实际语义时传标签文本；不传则 aria-hidden（纯装饰图标） */
  title?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * 本地 SVG 图标（雪碧图）。
 * 图标源文件放 src/icons/svg/，由 vite-plugin-svg-icons-ng 打包成一张 sprite，
 * 这里只是 `<svg><use href="#icon-xxx" /></svg>` 的封装。≈ Vue: <use :xlink:href="#icon-xxx">
 *
 * 选型约定：antd 组件自带的图标需求优先用 @ant-design/icons；
 * 只有设计稿给的私有图标、或需要与 rda-ui 共用同一套图标时才用本组件。
 */
export default function SvgIcon({
  name,
  size,
  color,
  spin,
  title,
  className,
  style,
}: SvgIconProps): ReactElement {
  // 名字写错时浏览器只会静默渲染成空白，这里在开发环境直接提示
  if (import.meta.env.DEV && !iconIds.includes(`icon-${name}`)) {
    const available = iconIds.map(id => id.replace(/^icon-/, ''));
    console.warn(`[SvgIcon] 图标 "${name}" 不存在，可用：`, available);
  }

  return (
    <svg
      className={clsx(styles.svgIcon, spin && styles.spin, className)}
      // size 落到 font-size，宽高用 em 继承，改一处即整体缩放
      style={{ fontSize: typeof size === 'number' ? `${size}px` : size, color, ...style }}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable={false}
    >
      {title ? <title>{title}</title> : null}
      {/* href 是 SVG2 写法，现代浏览器全支持；xlinkHref 已废弃 */}
      <use href={`#icon-${name}`} />
    </svg>
  );
}
