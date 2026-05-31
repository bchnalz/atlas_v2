import type { AuthUser } from '@/types'

type RouteCheck = (user: AuthUser | null) => boolean
type RouteAccessValue = 'authenticated' | 'admin' | RouteCheck

const ROUTE_ACCESS: Record<string, RouteAccessValue> = {
  '/login': 'authenticated',
  '/register': 'authenticated',
  '/': 'authenticated',
  '/dashboard': 'authenticated',
  '/devices': 'authenticated',
  '/tasks': 'authenticated',
  '/profile': 'authenticated',
  '/export': 'authenticated',
  '/import': 'authenticated',
  '/tasks/create': (u) =>
    u?.userCategory?.nama === 'Administrator' || u?.userCategory?.nama === 'Helpdesk',
  '/evaluation': (u) =>
    u?.userCategory?.nama === 'Administrator' || u?.userCategory?.nama === 'Helpdesk',
  '/admin/users': 'admin',
  '/master': (u) => isAdmin(u) || hasCapability(u, 'master_data'),
  '/master/skp-categories': (u) => isAdmin(u) || hasCapability(u, 'master_data'),
  '/master/locations': (u) => isAdmin(u) || hasCapability(u, 'master_data'),
  '/master/device-types': (u) => isAdmin(u) || hasCapability(u, 'master_data'),
  '/master/item-types': (u) => isAdmin(u) || hasCapability(u, 'master_data'),
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.userCategory?.is_admin === true
}

export function hasCapability(user: AuthUser | null, cap: string): boolean {
  return user?.profile?.capabilities?.includes(cap) ?? false
}

export function canAccess(path: string, user: AuthUser | null): boolean {
  if (!user && path === '/login') return true
  const rule = ROUTE_ACCESS[path]
  if (!rule) return false
  if (!user) return false
  if (rule === 'authenticated') return true
  if (rule === 'admin') return isAdmin(user)
  return (rule as RouteCheck)(user)
}

export function getNavigationItems(user: AuthUser | null) {
  const items = [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Devices', path: '/devices', icon: 'Monitor' },
    { label: 'Tasks', path: '/tasks', icon: 'ListTodo' },
  ]
  const secondary: { label: string; path: string; icon: string }[] = []
  if (isAdmin(user) || hasCapability(user, 'master_data')) {
    secondary.push({ label: 'Master Data', path: '/master/locations', icon: 'Database' })
  }
  if (isAdmin(user)) {
    secondary.push({ label: 'User Management', path: '/admin/users', icon: 'Users' })
  }
  if (user?.userCategory?.nama === 'Administrator' || user?.userCategory?.nama === 'Helpdesk') {
    secondary.push({ label: 'Evaluation', path: '/evaluation', icon: 'BarChart3' })
  }
  secondary.push({ label: 'Profile', path: '/profile', icon: 'User' })
  return { main: items, secondary }
}
