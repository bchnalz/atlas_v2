import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Monitor,
  ListTodo,
  Database,
  Users,
  User,
  ChevronLeft,
  LogOut,
  FileSpreadsheet,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isAdmin, hasCapability } from '@/lib/routeAccess'
import type { AuthUser } from '@/types'
import { useState } from 'react'

interface SidebarProps {
  user: AuthUser | null
  onLogout: () => void
}

const mainLinks = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Devices', path: '/devices', icon: Monitor },
  { label: 'Tasks', path: '/tasks', icon: ListTodo },
]

export function Sidebar({ user, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r bg-sidebar-background transition-all duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        <span className={cn('font-semibold', collapsed && 'hidden')}>ATLAS</span>
        <Button
          variant="ghost"
          size="icon-xs"
          className="ml-auto"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft className={cn('size-4 transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {mainLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <link.icon className="size-4 shrink-0" />
            {!collapsed && <span>{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-2 space-y-1">
        {(isAdmin(user) || hasCapability(user, 'master_data')) && (
          <NavLink
            to="/master/locations"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <Database className="size-4 shrink-0" />
            {!collapsed && <span>Master Data</span>}
          </NavLink>
        )}
        {isAdmin(user) && (
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <Users className="size-4 shrink-0" />
            {!collapsed && <span>User Mgmt</span>}
          </NavLink>
        )}
        <NavLink
          to="/export"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )
          }
        >
          <FileSpreadsheet className="size-4 shrink-0" />
          {!collapsed && <span>Export</span>}
        </NavLink>
        <NavLink
          to="/import"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )
          }
        >
          <Upload className="size-4 shrink-0" />
          {!collapsed && <span>Import</span>}
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )
          }
        >
          <User className="size-4 shrink-0" />
          {!collapsed && <span>Profile</span>}
        </NavLink>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
