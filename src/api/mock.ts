import { USER_DEPARTMENTS, USER_ROLES, USER_STATUSES } from '@/constants/dict';
import type { PageResult } from '@/types/common';
import type { UserInfo, UserListParams, UserFormValues } from './user';
import { delay } from './env';

const SURNAME = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
const GIVEN = ['伟', '芳', '娜', '敏', '静', '磊', '洋', '勇', '艳', '杰'];

/** 稳定的伪随机，保证刷新后数据一致 */
function seeded(index: number) {
  const x = Math.sin(index + 1) * 10000;
  return x - Math.floor(x);
}

function createUsers(count: number): UserInfo[] {
  return Array.from({ length: count }, (_, i) => {
    const id = i + 1;
    const day = String((i % 28) + 1).padStart(2, '0');
    const month = String((i % 12) + 1).padStart(2, '0');
    return {
      id,
      name: `${SURNAME[Math.floor(seeded(id) * SURNAME.length)]}${
        GIVEN[Math.floor(seeded(id * 2) * GIVEN.length)]
      }`,
      email: `user${id}@example.com`,
      department: USER_DEPARTMENTS[Math.floor(seeded(id * 3) * USER_DEPARTMENTS.length)],
      role: USER_ROLES[Math.floor(seeded(id * 4) * USER_ROLES.length)],
      status: USER_STATUSES[Math.floor(seeded(id * 5) * USER_STATUSES.length)],
      createdAt: `2026-${month}-${day}`,
      loginCount: Math.floor(seeded(id * 6) * 300),
    };
  });
}

const DB = createUsers(57);

/** 模拟后端分页接口：过滤 -> 排序 -> 分页 */
export async function mockUserList(params: UserListParams): Promise<PageResult<UserInfo>> {
  await delay(300);

  const { name, department, status, dateRange, startTime, endTime, page, pageSize } = params;

  const rows = DB.filter(row => {
    if (name && !row.name.includes(name)) return false;
    if (department && row.department !== department) return false;
    if (status && row.status !== status) return false;
    const range = dateRange ?? (startTime && endTime ? [startTime, endTime] : undefined);
    if (range?.[0] && row.createdAt < range[0]) return false;
    if (range?.[1] && row.createdAt > range[1]) return false;
    return true;
  });

  return {
    list: rows.slice((page - 1) * pageSize, page * pageSize),
    total: rows.length,
  };
}

export async function mockDeleteUser(id: number): Promise<null> {
  await delay(200);
  const index = DB.findIndex(row => row.id === id);
  if (index > -1) DB.splice(index, 1);
  return null;
}

let nextId = 1000;

export async function mockCreateUser(values: UserFormValues): Promise<UserInfo> {
  await delay(400);
  const row: UserInfo = { ...values, id: nextId++, loginCount: 0 };
  DB.unshift(row);
  return row;
}

export async function mockUpdateUser(id: number, values: UserFormValues): Promise<UserInfo> {
  await delay(400);
  const index = DB.findIndex(row => row.id === id);
  if (index < 0) throw new Error('用户不存在');
  DB[index] = { ...DB[index], ...values };
  return DB[index];
}
