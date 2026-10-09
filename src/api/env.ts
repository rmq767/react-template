/**
 * mock 开关与延时：`auth.ts` / `user.ts` / `mock.ts` 都要用，集中一处定义。
 * 散在三处写 `import.meta.env.VITE_USE_MOCK === 'true'` 的话，改判定方式（比如放宽成非空判断）得同时改三遍。
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/** 模拟网络延时，让 loading 态在本地看得见 */
export const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
