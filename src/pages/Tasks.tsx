import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const statusColors: Record<string, string> = {
  pending: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  accepted: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  in_progress: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  on_hold: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  completed: 'bg-green-500/10 text-green-600 dark:text-green-400',
  cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400',
}

const priorColors: Record<string, string> = {
  urgent: 'bg-red-500/10 text-red-600 dark:text-red-400',
  high: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  normal: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  low: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
}

export default function Tasks() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const navigate = useNavigate()

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', search, statusFilter],
    queryFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id
      let q = supabase
        .from('task_assignments')
        .select('*, task_assignment_users!inner(user_id, status)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      // Filter by current user's tasks
      q = q.eq('task_assignment_users.user_id', userId)

      if (search) q = q.or(`title.ilike.%${search}%,task_number.ilike.%${search}%`)
      if (statusFilter !== 'all') q = q.eq('status', statusFilter)

      const { data } = await q
      return data ?? []
    },
    refetchInterval: 15000,
  })

  // Summary counts
  const summary = {
    total: tasks?.length ?? 0,
    pending: tasks?.filter((t) => t.status === 'pending' || t.status === 'accepted').length ?? 0,
    inProgress: tasks?.filter((t) => t.status === 'in_progress').length ?? 0,
    completed: tasks?.filter((t) => t.status === 'completed').length ?? 0,
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My Tasks</h1>
        <Button onClick={() => navigate('/tasks/create')}>
          <Plus className="mr-2 size-4" />
          New Task
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-semibold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
              {summary.pending}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
              {summary.inProgress}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {summary.completed}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 rounded-lg border bg-background px-3 text-xs"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="in_progress">In Progress</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : tasks?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-sm text-muted-foreground">
                  No tasks assigned â€”{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={() => navigate('/tasks/create')}
                  >
                    create one
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              tasks?.map((t: any) => (
                <TableRow
                  key={t.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/tasks/${t.id}`)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground font-mono">{t.task_number}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`rounded-full ${priorColors[t.priority]}`}>
                      {t.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`rounded-full ${statusColors[t.status]}`}>
                      {t.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString('en-ID', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
