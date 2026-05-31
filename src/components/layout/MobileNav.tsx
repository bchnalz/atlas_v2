import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Monitor,
  ListTodo,
  Database,
  Users,
  User,
  MoreHorizontal,
  LogOut,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { isAdmin, hasCapability } from '@/lib/routeAccess'
import type { AuthUser } from '@/types'

interface MobileNavProps {
  user: AuthUser | null
  onLogout: () => void
}

const tabs = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Devices', path: '/devices', icon: Monitor },
  { label: 'Tasks', path: '/tasks', icon: ListTodo },
]

export function MobileNav({ user, onLogout }: MobileNavProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const secondaryItems = [
    ...(isAdmin(user) || hasCapability(user, 'master_data')
      ? [{ label: 'Master Data', path: '/master/locations', icon: Database }]
      : []),
    ...(isAdmin(user) ? [{ label: 'User Management', path: '/admin/users', icon: Users }] : []),
    { label: 'Profile', path: '/profile', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t bg-background lg:hidden">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <tab.icon className="size-5" />
            {tab.label}
          </button>
        )
      })}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium text-muted-foreground">
            <MoreHorizontal className="size-5" />
            More
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="mb-2 w-48">
          {secondaryItems.map((item) => (
            <DropdownMenuItem key={item.path} onClick={() => navigate(item.path)}>
              <item.icon className="mr-2 size-4" />
              {item.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} className="text-destructive">
            <LogOut className="mr-2 size-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}
