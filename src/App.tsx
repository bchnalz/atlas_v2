import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Devices from '@/pages/Devices'
import Tasks from '@/pages/Tasks'
import Profile from '@/pages/Profile'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="flex min-h-screen flex-col items-center justify-center gap-2">
                <h1 className="text-2xl font-semibold">404</h1>
                <p className="text-sm text-muted-foreground">Page not found.</p>
                <a
                  href="/dashboard"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Go to Dashboard
                </a>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
