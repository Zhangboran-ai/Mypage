import { useEffect, type ReactNode } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { PageFallback } from '@/components/common/PageFallback'
import { ErrorState } from '@/components/ui/ErrorState'
import { useMe } from './use-auth'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { data, isLoading, isError, refetch } = useMe()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleUnauthorized = () => {
      navigate(
        `/admin/login?redirect=${encodeURIComponent(location.pathname + location.search)}`,
        { replace: true },
      )
    }

    window.addEventListener('astra:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('astra:unauthorized', handleUnauthorized)
  }, [location.pathname, location.search, navigate])

  if (isLoading) return <PageFallback />

  if (isError) {
    const redirect = encodeURIComponent(location.pathname + location.search)

    // 会话失效与网络错误都走登录页，登录成功后回到原路径
    if (navigator.onLine) {
      return <Navigate to={`/admin/login?redirect=${redirect}`} replace />
    }

    return (
      <div className="container-page py-20">
        <ErrorState message="无法连接服务器。" onRetry={() => void refetch()} />
      </div>
    )
  }

  if (!data?.user) return <Navigate to="/admin/login" replace />

  return <>{children}</>
}
