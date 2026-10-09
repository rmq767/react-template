import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

/** 未匹配到任何路由 */
export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="page-result">
      <Result
        status="404"
        title="404"
        subTitle="页面不存在，地址可能写错了"
        extra={
          <Button type="primary" onClick={() => navigate('/', { replace: true })}>
            回到首页
          </Button>
        }
      />
    </div>
  )
}
