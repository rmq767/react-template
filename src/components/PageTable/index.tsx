import { Card, Table } from 'antd'
import type { ReactNode } from 'react'
import type { TableColumnsType, TablePaginationConfig, TableProps } from 'antd'
import styles from './index.module.scss'

export interface PageTableProps<T> {
  columns: TableColumnsType<T>
  dataSource: T[]
  rowKey: TableProps<T>['rowKey']
  loading?: boolean
  /** 分页配置由 useTableList 提供，传 false 则不显示分页 */
  pagination?: TablePaginationConfig | false
  /** 表格上方工具条，取代 Vue 的具名插槽 */
  toolbar?: ReactNode
  /** Card 右上角操作区 */
  extra?: ReactNode
  title?: ReactNode
  scroll?: TableProps<T>['scroll']
  size?: TableProps<T>['size']
  /** 大数据量虚拟滚动，antd v6 Table 原生支持 */
  virtual?: boolean
}

/**
 * 纯展示表格：只吃数据和配置，不碰请求、不碰分页状态。
 * 数据与分页状态由父组件的 useTableList 提供。
 * ≈ Vue 里一个无状态子组件：靠 props 接收一切，自己不拉数据。
 */
export default function PageTable<T extends object>(props: PageTableProps<T>) {
  const {
    columns,
    dataSource,
    rowKey,
    loading,
    pagination,
    toolbar,
    extra,
    title,
    scroll,
    size = 'middle',
    virtual,
  } = props

  return (
    <Card className={styles.card} title={title} extra={extra}>
      {toolbar ? <div className={styles.toolbar}>{toolbar}</div> : null}
      <Table<T>
        className={styles.table}
        columns={columns}
        dataSource={dataSource}
        rowKey={rowKey}
        loading={loading}
        pagination={pagination}
        scroll={scroll}
        size={size}
        virtual={virtual}
      />
    </Card>
  )
}
