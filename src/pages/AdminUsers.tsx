import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, Loader2, Save } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showDialog, setShowDialog] = useState(false)
  const queryClient = useQueryClient()

  // Edit form state
  const [editRole, setEditRole] = useState('')
  const [editCapabilities, setEditCapabilities] = useState<string[]>([])

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      let q = supabase
        .from('profiles')
        .select('*, user_categories!inner(id, nama, is_admin)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (search) {
        q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      const { data } = await q
      return data ?? []
    },
  })

  const { data: categories } = useQuery({
    queryKey: ['user-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('user_categories').select('*')
      return data ?? []
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .update({
          user_category_id: editRole || null,
          capabilities: editCapabilities,
        })
        .eq('id', selectedUser.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setShowDialog(false)
    },
  })

  const openEdit = (user: any) => {
    setSelectedUser(user)
    setEditRole(user.user_category_id ?? '')
    setEditCapabilities(user.capabilities ?? [])
    setShowDialog(true)
  }

  const toggleCap = (cap: string) => {
    setEditCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap],
    )
  }

  const availableCaps = [
    { id: 'master_data', label: 'Can manage master data (SKP, Locations, Device/Item Types)' },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">User Management</h1>
      </div>

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Capabilities</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : users?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users?.map((u: any) => (
                <TableRow key={u.id} className="cursor-pointer" onClick={() => openEdit(u)}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-full">
                      {u.user_categories?.nama ?? 'â€”'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {u.capabilities?.length ? u.capabilities.join(', ') : 'â€”'}
                  </TableCell>
                  <TableCell className="text-xs">{u.department ?? 'â€”'}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`rounded-full ${u.status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-600'}`}
                    >
                      {u.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser?.full_name}</DialogTitle>
            <DialogDescription>{selectedUser?.email}</DialogDescription>
          </DialogHeader>

          {selectedUser && selectedUser.id !== currentUser?.id && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="flex h-8 w-full rounded-lg border bg-background px-3 py-1 text-sm"
                >
                  <option value="">Select role</option>
                  {categories?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.nama}
                    </option>
                  ))}
                </select>
              </div>

              {!categories?.find((c: any) => c.id === editRole)?.is_admin && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Capabilities</label>
                  <div className="space-y-2">
                    {availableCaps.map((cap) => (
                      <label key={cap.id} className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editCapabilities.includes(cap.id)}
                          onChange={() => toggleCap(cap.id)}
                          className="mt-0.5"
                        />
                        <span className="text-sm">{cap.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {categories?.find((c: any) => c.id === editRole)?.is_admin && (
                <p className="text-xs text-muted-foreground">
                  Administrator role has full access. Capabilities cannot be set for admin accounts.
                </p>
              )}
            </div>
          )}

          {selectedUser && selectedUser.id === currentUser?.id && (
            <p className="text-sm text-muted-foreground">You cannot edit your own account.</p>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            {selectedUser?.id !== currentUser?.id && (
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                Save
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
