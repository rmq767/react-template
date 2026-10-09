import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

/** 角色不匹配时由 AuthGuard 重定向到这里 */
export default function ForbiddenPage() {
  const navigate = useNavigate()
  const token = useAuthStore(state => state.token)

  return (
    <div className="page-result">
      <Result
        status="403"
        title="403"
        subTitle="当前账号的角色没有访问该页面的权限"
        extra={
          <Button type="primary" onClick={() => navigate(token ? '/' : '/login', { replace: true })}>
            {token ? '回到首页' : '去登录'}
          </Button>
        }
      />
    </div>
  )
}
