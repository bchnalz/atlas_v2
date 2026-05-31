import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Play, Pause, CheckCircle, Circle, Monitor, Clock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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

export default function TaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [completionNote, setCompletionNote] = useState('')
  const [showComplete, setShowComplete] = useState(false)
  const [holdReason, setHoldReason] = useState('')
  const [showHold, setShowHold] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const { data: t } = await supabase.from('task_assignments').select('*').eq('id', id).single()
      if (!t) return null
      const { data: users } = await supabase
        .from('task_assignment_users')
        .select('*, profiles(id, full_name)')
        .eq('task_assignment_id', id)
      const { data: subtasks } = await supabase
        .from('task_subtasks')
        .select('*')
        .eq('task_assignment_id', id)
        .order('order_index')
      const { data: history } = await supabase
        .from('task_history')
        .select('*, profiles!performed_by(id, full_name)')
        .eq('task_assignment_id', id)
        .order('created_at', { ascending: false })
        .limit(20)
      const { data: devices } = await supabase
        .from('task_assignment_devices')
        .select('*, perangkat!inner(id, nama_perangkat, serial_number)')
        .eq('task_assignment_id', id)
      return {
        ...t,
        assignments: users ?? [],
        subtasks: subtasks ?? [],
        log: history ?? [],
        devices: devices ?? [],
      }
    },
    refetchInterval: 10000,
  })

  const statusMutation = useMutation({
    mutationFn: async ({ status, note }: { status: string; note?: string }) => {
      const uid = (await supabase.auth.getUser()).data.user?.id
      await supabase
        .from('task_assignment_users')
        .update({ status })
        .eq('task_assignment_id', id)
        .eq('user_id', uid)
      if (status === 'completed') {
        const { data: all } = await supabase
          .from('task_assignment_users')
          .select('status')
          .eq('task_assignment_id', id)
        if (all?.every((a) => a.status === 'completed')) {
          await supabase
            .from('task_assignments')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              completion_notes: note,
            })
            .eq('id', id)
        }
      }
      await supabase
        .from('task_history')
        .insert({ task_assignment_id: id, action: status, performed_by: uid, notes: note })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] })
      setShowComplete(false)
      setShowHold(false)
      setCompletionNote('')
      setHoldReason('')
    },
  })

  const taskStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const uid = (await supabase.auth.getUser()).data.user?.id
      await supabase.from('task_assignments').update({ status }).eq('id', id)
      await supabase
        .from('task_history')
        .insert({ task_assignment_id: id, action: status, performed_by: uid })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task', id] }),
  })

  const [elapsed, setElapsed] = useState(0)
  const { data: myAssign } = useQuery({
    queryKey: ['my-task-assign', id],
    queryFn: async () => {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return null
      const { data } = await supabase
        .from('task_assignment_users')
        .select('*')
        .eq('task_assignment_id', id)
        .eq('user_id', uid)
        .single()
      return data
    },
  })

  useEffect(() => {
    if (myAssign?.status === 'in_progress' && myAssign?.started_at) {
      const started = new Date(myAssign.started_at).getTime()
      const base = (myAssign.work_duration_minutes ?? 0) * 60
      timerRef.current = setInterval(() => {
        setElapsed(base + Math.floor((Date.now() - started) / 1000))
      }, 1000)
      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }
  }, [myAssign])

  const startTimer = async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id
    await supabase
      .from('task_assignment_users')
      .update({ status: 'in_progress', started_at: new Date().toISOString() })
      .eq('task_assignment_id', id)
      .eq('user_id', uid)
    await supabase
      .from('task_assignments')
      .update({ status: 'in_progress', started_at: new Date().toISOString() })
      .eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['task', id] })
  }

  const pauseTimer = async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!myAssign?.started_at) return
    const extra = Math.floor((Date.now() - new Date(myAssign.started_at).getTime()) / 60000)
    const total = (myAssign.work_duration_minutes ?? 0) + extra
    await supabase
      .from('task_assignment_users')
      .update({
        status: 'on_hold',
        paused_at: new Date().toISOString(),
        work_duration_minutes: total,
      })
      .eq('task_assignment_id', id)
      .eq('user_id', uid)
    await supabase.from('task_assignments').update({ status: 'on_hold' }).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['task', id] })
  }

  const fmt = (s: number) => `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`

  if (isLoading)
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  if (!task)
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Task not found</p>
      </div>
    )

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tasks')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold">{task.title}</h1>
            <Badge className={`rounded-full ${statusColors[task.status]}`}>
              {task.status.replace(/_/g, ' ')}
            </Badge>
            <Badge variant="outline" className={`rounded-full ${priorColors[task.priority]}`}>
              {task.priority}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono">{task.task_number}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        {myAssign?.status === 'accepted' && (
          <Button size="sm" onClick={() => startTimer()}>
            <Play className="mr-2 size-4" /> Start
          </Button>
        )}
        {myAssign?.status === 'in_progress' && (
          <>
            <Button size="sm" variant="secondary" onClick={pauseTimer}>
              <Pause className="mr-2 size-4" /> Pause ({fmt(elapsed)})
            </Button>
            <Button size="sm" onClick={() => setShowComplete(true)}>
              <CheckCircle className="mr-2 size-4" /> Complete
            </Button>
          </>
        )}
        {myAssign?.status === 'pending' && (
          <Button size="sm" onClick={() => statusMutation.mutate({ status: 'accepted' })}>
            <Circle className="mr-2 size-4" /> Accept
          </Button>
        )}
        {myAssign?.status === 'on_hold' && (
          <Button size="sm" onClick={() => startTimer()}>
            <Play className="mr-2 size-4" /> Resume
          </Button>
        )}
        {task.status !== 'completed' && task.status !== 'cancelled' && (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => taskStatusMutation.mutate('cancelled')}
          >
            Cancel
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {task.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{task.description}</p>
              </CardContent>
            </Card>
          )}

          {task.subtasks?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Subtasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {task.subtasks.map((st: any) => (
                  <div key={st.id} className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={st.status === 'completed'}
                      readOnly
                      className="rounded"
                    />
                    <span
                      className={
                        st.status === 'completed' ? 'line-through text-muted-foreground' : ''
                      }
                    >
                      {st.title}
                    </span>
                    {st.estimated_duration_minutes && (
                      <span className="text-xs text-muted-foreground">
                        ({st.estimated_duration_minutes}m)
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="size-4" /> Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-60 overflow-y-auto">
              {task.log?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet</p>
              ) : (
                task.log?.map((h: any) => (
                  <div key={h.id} className="flex items-start gap-2 text-xs">
                    <span className="text-muted-foreground shrink-0">
                      {new Date(h.created_at).toLocaleString('en-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="font-medium">{h.profiles?.full_name ?? 'System'}</span>
                    <span className="text-muted-foreground">{h.action.replace(/_/g, ' ')}</span>
                    {h.notes && <span className="text-muted-foreground italic">â€” {h.notes}</span>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Assigned To</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {task.assignments?.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span>{a.profiles?.full_name ?? 'Unknown'}</span>
                  <Badge
                    variant="outline"
                    className={`rounded-full text-xs ${statusColors[a.status]}`}
                  >
                    {a.status}
                  </Badge>
                </div>
              ))}
              {task.assignments?.length === 0 && (
                <p className="text-xs text-muted-foreground">Not assigned</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Linked Devices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {task.devices?.map((d: any) => (
                <div
                  key={d.id}
                  className="text-sm cursor-pointer hover:text-primary"
                  onClick={() => navigate(`/devices/${d.perangkat_id}`)}
                >
                  <Monitor className="inline size-3 mr-1" />{' '}
                  {d.perangkat?.nama_perangkat ?? 'Unknown'}
                </div>
              ))}
              {task.devices?.length === 0 && (
                <p className="text-xs text-muted-foreground">No devices linked</p>
              )}
            </CardContent>
          </Card>

          {task.skp_category_id && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">SKP Category</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{task.skp_category_id}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showComplete} onOpenChange={setShowComplete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
          </DialogHeader>
          <textarea
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
            className="flex min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm resize-y"
            placeholder="Completion notes..."
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowComplete(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => statusMutation.mutate({ status: 'completed', note: completionNote })}
            >
              <CheckCircle className="mr-2 size-4" /> Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showHold} onOpenChange={setShowHold}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Put on Hold</DialogTitle>
          </DialogHeader>
          <textarea
            value={holdReason}
            onChange={(e) => setHoldReason(e.target.value)}
            className="flex min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm resize-y"
            placeholder="Reason for hold..."
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowHold(false)}>
              Cancel
            </Button>
            <Button onClick={() => statusMutation.mutate({ status: 'on_hold', note: holdReason })}>
              Hold
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
