import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { canAccess } from '@/lib/routeAccess'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!canAccess(location.pathname, user)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2">
        <h1 className="text-2xl font-semibold">403</h1>
        <p className="text-sm text-muted-foreground">You don't have access to this page.</p>
        <a href="/dashboard" className="text-sm text-primary underline-offset-4 hover:underline">
          Go to Dashboard
        </a>
      </div>
    )
  }

  return <>{children}</>
}
