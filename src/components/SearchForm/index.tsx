import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Button, Col, DatePicker, Input, Row, Select, Space } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import clsx from 'clsx'
import styles from './index.module.scss'

export interface FilterOption {
  label: string
  value: string | number
}

/** 配置驱动的筛选项定义，等价于 Vue 版 MySearch 的 filterSchema */
export interface FilterSchemaItem {
  name: string
  label: string
  type: 'input' | 'select' | 'dateRange'
  options?: FilterOption[]
  placeholder?: string
  /** 栅格占位，24 栅格制，默认 8（一行三个） */
  span?: number
}

export interface SearchFormProps<F extends Record<string, unknown>> {
  schema: FilterSchemaItem[]
  /** 当前已生效的筛选值（来自 URL） */
  values: F
  /** 默认值，用于「重置」时清空草稿 */
  defaultValues: F
  onSubmit: (draft: Partial<F>) => void
  onReset: () => void
  /** 右侧操作区（新增、导出等按钮）。React 里用 ReactNode prop 取代 Vue 的具名插槽 */
  extra?: ReactNode
}

const DATE_FORMAT = 'YYYY-MM-DD'

/**
 * 纯受控 + 草稿模式的搜索表单：
 * 内部维护 draft，点「查询」才把草稿提交给 URL，避免输入即请求。
 */
export default function SearchForm<F extends Record<string, unknown>>(props: SearchFormProps<F>) {
  const { schema, values, defaultValues, onSubmit, onReset, extra } = props
  const [draft, setDraft] = useState<Record<string, unknown>>({ ...values })

  // 外部筛选变化（点查询、浏览器前进后退、重置）时回填草稿
  const committed = useMemo(() => JSON.stringify(values), [values])
  useEffect(() => {
    setDraft({ ...(JSON.parse(committed) as F) })
  }, [committed])

  const setValue = (name: string, value: unknown) =>
    setDraft(prev => ({ ...prev, [name]: value }))

  const renderControl = (item: FilterSchemaItem) => {
    const value = draft[item.name]

    if (item.type === 'select') {
      return (
        <Select
          className={styles.control}
          allowClear
          placeholder={item.placeholder ?? `请选择${item.label}`}
          options={item.options}
          // 筛选 store 里「未选」是空字符串，而 antd Select 只认 undefined/null 才显示 placeholder，
          // 传 '' 会被当成「选中了一个不存在的选项」从而渲染成空白
          value={(value as string | undefined) || undefined}
          onChange={next => setValue(item.name, next ?? '')}
        />
      )
    }

    if (item.type === 'dateRange') {
      const range = (value as [string, string] | null) ?? null
      const pickerValue: [Dayjs, Dayjs] | null =
        range?.length === 2 ? [dayjs(range[0]), dayjs(range[1])] : null
      return (
        <DatePicker.RangePicker
          className={styles.control}
          value={pickerValue}
          onChange={dates => {
            const [start, end] = dates ?? []
            setValue(
              item.name,
              start && end ? ([start.format(DATE_FORMAT), end.format(DATE_FORMAT)] as [string, string]) : null,
            )
          }}
        />
      )
    }

    return (
      <Input
        className={styles.control}
        allowClear
        placeholder={item.placeholder ?? `请输入${item.label}`}
        value={value as string}
        onChange={event => setValue(item.name, event.target.value)}
        onPressEnter={() => onSubmit(draft as Partial<F>)}
      />
    )
  }

  return (
    <div className={styles.search} data-search-form>
      <Row gutter={[16, 12]}>
        {schema.map(item => (
          <Col key={item.name} span={item.span ?? 8}>
            <Space.Compact className={styles.item}>
              <span className={styles.label}>{item.label}</span>
              {renderControl(item)}
            </Space.Compact>
          </Col>
        ))}

        <Col flex="none" className={clsx(styles.actions, extra && styles['actions-between'])}>
          <Space>
            <Button type="primary" onClick={() => onSubmit(draft as Partial<F>)}>
              查询
            </Button>
            <Button
              onClick={() => {
                setDraft(structuredClone({ ...defaultValues }))
                onReset()
              }}
            >
              重置
            </Button>
          </Space>
          {extra}
        </Col>
      </Row>
    </div>
  )
}
