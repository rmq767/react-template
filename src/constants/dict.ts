import type { UserStatus } from '@/api/user';

/**
 * 业务字典统一出口：筛选下拉、表单下拉、mock 数据都从这里取，
 * 避免「筛选项和真实数据不一致」这种低级不一致。
 * 真实项目中部门/角色一般来自字典接口，届时把常量换成 useQuery 结果即可。
 */
export const USER_DEPARTMENTS = ['研发中心', '市场运营部', '财务部', '人力资源部', '供应链部'];

export const USER_ROLES = ['管理员', '编辑', '访客', '审计'];

export const USER_STATUSES: UserStatus[] = ['active', 'inactive', 'pending'];

export type DictOption = { label: string; value: string };

/** antd options 不接受 readonly 数组，所以不用 as const */
export const DEPARTMENT_OPTIONS: DictOption[] = USER_DEPARTMENTS.map(item => ({
  label: item,
  value: item,
}));

export const ROLE_OPTIONS: DictOption[] = USER_ROLES.map(item => ({ label: item, value: item }));

/**
 * 状态文案单一来源：下拉选项与表格 Tag 都从这里取。
 * 以前 dict 写一份 label、columns 的 STATUS_MAP 再写一份，新增状态时很容易改漏。
 */
export const STATUS_LABELS: Record<UserStatus, string> = {
  active: '正常',
  inactive: '停用',
  pending: '待审核',
};

/** 取值以 USER_STATUSES 为唯一来源派生，避免枚举与 mock 数据对不上 */
export const STATUS_OPTIONS: DictOption[] = USER_STATUSES.map(value => ({
  label: STATUS_LABELS[value],
  value,
}));
