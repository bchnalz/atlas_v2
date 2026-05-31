import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { useAuth } from '@/hooks/useAuth'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function AppLayout() {
  const { user, logout } = useAuth()
  const [showLogout, setShowLogout] = useState(false)

  const handleLogout = async () => {
    await logout()
    setShowLogout(false)
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} onLogout={() => setShowLogout(true)} />
      <main className="flex-1 pb-16 lg:pb-0">
        <Outlet />
      </main>
      <MobileNav user={user} onLogout={() => setShowLogout(true)} />

      <Dialog open={showLogout} onOpenChange={setShowLogout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logout</DialogTitle>
            <DialogDescription>Are you sure you want to logout?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowLogout(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
