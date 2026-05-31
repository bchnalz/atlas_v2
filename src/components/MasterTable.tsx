import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Save, Loader2, Search, Pencil, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

interface MasterTableProps<T> {
  title: string
  columns: { key: string; label: string }[]
  queryKey: string[]
  fetchFn: () => Promise<T[]>
  createFn: (data: Record<string, string>) => Promise<void>
  updateFn: (id: string, data: Record<string, string>) => Promise<void>
  deleteFn: (id: string) => Promise<void>
  fields: { key: string; label: string; required?: boolean }[]
  rowRender: (item: T) => ReactNode
}

export function MasterTable<T extends { id: string; deleted_at?: string | null }>({
  title,
  columns,
  queryKey,
  fetchFn,
  createFn,
  updateFn,
  deleteFn,
  fields,
  rowRender,
}: MasterTableProps<T>) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [showDelete, setShowDelete] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: fetchFn,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        await updateFn(editing.id, form)
      } else {
        await createFn(form)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setShowForm(false)
      setEditing(null)
      setForm({})
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (deletingId) await deleteFn(deletingId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setShowDelete(false)
      setDeletingId(null)
      setDeleteError('')
    },
    onError: (err: Error) => {
      setDeleteError(err.message)
    },
  })

  const openCreate = () => {
    setEditing(null)
    setForm({})
    setShowForm(true)
  }

  const openEdit = (item: T) => {
    setEditing(item)
    const f: Record<string, string> = {}
    fields.forEach((field) => {
      f[field.key] = (item as any)[field.key] ?? ''
    })
    setForm(f)
    setShowForm(true)
  }

  const confirmDelete = (id: string) => {
    setDeletingId(id)
    setDeleteError('')
    setShowDelete(true)
  }

  const filtered = data?.filter((item: any) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return columns.some((col) =>
      String(item[col.key] ?? '')
        .toLowerCase()
        .includes(searchLower),
    )
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">{title}</h2>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 size-4" />
          Add
        </Button>
      </div>

      <div className="relative max-w-sm mb-3">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="text-center py-8 text-sm text-muted-foreground"
                >
                  No {title.toLowerCase()} found
                </TableCell>
              </TableRow>
            ) : (
              filtered?.map((item) => (
                <TableRow key={item.id}>
                  {rowRender(item)}
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => openEdit(item)}>
                        <Pencil className="size-3" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => confirmDelete(item.id)}>
                        <Trash2 className="size-3 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit' : 'Add'} {title.slice(0, -1)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </label>
                <Input
                  value={form[field.key] ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  required={field.required}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              {editing ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {title.slice(0, -1)}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will soft-delete this item. Are you sure?
          </p>
          {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 size-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
