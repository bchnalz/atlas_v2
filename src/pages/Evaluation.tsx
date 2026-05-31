import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function Evaluation() {
  const { data, isLoading } = useQuery({
    queryKey: ['evaluation'],
    queryFn: async () => {
      const { data: tasks } = await supabase
        .from('task_assignment_users')
        .select(
          '*, task_assignments!inner(id, task_number, title, status, assigned_by, completed_at, created_at, priority), profiles!user_id(id, full_name)',
        )
        .in('status', ['completed', 'in_progress'])
        .order('task_assignments.created_at', { ascending: false })
        .limit(100)

      const byTech: Record<
        string,
        { name: string; total: number; completed: number; active: number }
      > = {}
      tasks?.forEach((t: any) => {
        const uid = t.user_id
        const name = t.profiles?.full_name ?? 'Unknown'
        if (!byTech[uid]) byTech[uid] = { name, total: 0, completed: 0, active: 0 }
        byTech[uid].total++
        if (t.status === 'completed') byTech[uid].completed++
        if (t.status === 'in_progress') byTech[uid].active++
      })

      return { rows: tasks ?? [], summary: Object.values(byTech).sort((a, b) => b.total - a.total) }
    },
  })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold mb-6">Evaluation Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          : data?.summary.map((s: any) => (
              <Card key={s.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{s.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-semibold">{s.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-green-500">{s.completed}</p>
                    <p className="text-xs text-muted-foreground">Done</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-yellow-500">{s.active}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                    No task data yet
                  </TableCell>
                </TableRow>
              ) : (
                data?.rows.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="text-sm font-medium">{r.task_assignments?.title}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {r.task_assignments?.task_number}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">{r.profiles?.full_name}</TableCell>
                    <TableCell>
                      <span
                        className={`text-xs rounded-full px-2 py-0.5 ${r.status === 'completed' ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}`}
                      >
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs capitalize">
                      {r.task_assignments?.priority}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(r.task_assignments?.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
