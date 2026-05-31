import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Devices from '@/pages/Devices'
import DeviceDetail from '@/pages/DeviceDetail'
import DeviceForm from '@/pages/DeviceForm'
import MutationWizard from '@/pages/MutationWizard'
import Tasks from '@/pages/Tasks'
import TaskDetail from '@/pages/TaskDetail'
import TaskForm from '@/pages/TaskForm'
import Profile from '@/pages/Profile'
import AdminUsers from '@/pages/AdminUsers'
import MasterData from '@/pages/MasterData'
import ExportPage from '@/pages/ExportPage'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/devices/new" element={<DeviceForm />} />
            <Route path="/devices/:id" element={<DeviceDetail />} />
            <Route path="/devices/:id/edit" element={<DeviceForm />} />
            <Route path="/devices/:id/transfer" element={<MutationWizard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/create" element={<TaskForm />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/master" element={<Navigate to="/master/locations" replace />} />
            <Route path="/master/:tab" element={<MasterData />} />
            <Route path="/export" element={<ExportPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

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
