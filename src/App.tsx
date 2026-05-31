import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Loader2 } from 'lucide-react'

const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Devices = lazy(() => import('@/pages/Devices'))
const DeviceDetail = lazy(() => import('@/pages/DeviceDetail'))
const DeviceForm = lazy(() => import('@/pages/DeviceForm'))
const MutationWizard = lazy(() => import('@/pages/MutationWizard'))
const Tasks = lazy(() => import('@/pages/Tasks'))
const TaskDetail = lazy(() => import('@/pages/TaskDetail'))
const TaskForm = lazy(() => import('@/pages/TaskForm'))
const Profile = lazy(() => import('@/pages/Profile'))
const AdminUsers = lazy(() => import('@/pages/AdminUsers'))
const MasterData = lazy(() => import('@/pages/MasterData'))
const ExportPage = lazy(() => import('@/pages/ExportPage'))
const ImportPage = lazy(() => import('@/pages/ImportPage'))
const Evaluation = lazy(() => import('@/pages/Evaluation'))
const Notifications = lazy(() => import('@/pages/Notifications'))

const L = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    }
  >
    {children}
  </Suspense>
)

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <L>
                <Login />
              </L>
            }
          />
          <Route
            path="/register"
            element={
              <L>
                <Register />
              </L>
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/dashboard"
              element={
                <L>
                  <Dashboard />
                </L>
              }
            />
            <Route
              path="/devices"
              element={
                <L>
                  <Devices />
                </L>
              }
            />
            <Route
              path="/devices/new"
              element={
                <L>
                  <DeviceForm />
                </L>
              }
            />
            <Route
              path="/devices/:id"
              element={
                <L>
                  <DeviceDetail />
                </L>
              }
            />
            <Route
              path="/devices/:id/edit"
              element={
                <L>
                  <DeviceForm />
                </L>
              }
            />
            <Route
              path="/devices/:id/transfer"
              element={
                <L>
                  <MutationWizard />
                </L>
              }
            />
            <Route
              path="/tasks"
              element={
                <L>
                  <Tasks />
                </L>
              }
            />
            <Route
              path="/tasks/create"
              element={
                <L>
                  <TaskForm />
                </L>
              }
            />
            <Route
              path="/tasks/:id"
              element={
                <L>
                  <TaskDetail />
                </L>
              }
            />
            <Route
              path="/profile"
              element={
                <L>
                  <Profile />
                </L>
              }
            />
            <Route
              path="/admin/users"
              element={
                <L>
                  <AdminUsers />
                </L>
              }
            />
            <Route path="/master" element={<Navigate to="/master/locations" replace />} />
            <Route
              path="/master/:tab"
              element={
                <L>
                  <MasterData />
                </L>
              }
            />
            <Route
              path="/export"
              element={
                <L>
                  <ExportPage />
                </L>
              }
            />
            <Route
              path="/import"
              element={
                <L>
                  <ImportPage />
                </L>
              }
            />
            <Route
              path="/evaluation"
              element={
                <L>
                  <Evaluation />
                </L>
              }
            />
            <Route
              path="/notifications"
              element={
                <L>
                  <Notifications />
                </L>
              }
            />
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
