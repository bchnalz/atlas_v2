import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Save, Loader2, Plus, GripVertical, X } from 'lucide-react'

export default function TaskForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('normal')
  const [skpCategoryId, setSkpCategoryId] = useState('')
  const [subtasks, setSubtasks] = useState<
    { title: string; assignee_id: string; estimated_minutes: number }[]
  >([])
  const [subtaskTitle, setSubtaskTitle] = useState('')

  const { data: skpCategories } = useQuery({
    queryKey: ['skp-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('skp_categories').select('*').is('deleted_at', null)
      return data ?? []
    },
  })

  // Users query placeholder — assignee selector in task creation

  const createMutation = useMutation({
    mutationFn: async () => {
      // Generate task number
      const { count } = await supabase
        .from('task_assignments')
        .select('*', { count: 'exact', head: true })
      const taskNumber = `TASK-${String((count ?? 0) + 1).padStart(4, '0')}`

      const { data: task, error: taskError } = await supabase
        .from('task_assignments')
        .insert({
          task_number: taskNumber,
          title,
          description,
          priority,
          skp_category_id: skpCategoryId || null,
          assigned_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single()

      if (taskError) throw taskError

      // Create subtasks
      if (subtasks.length > 0) {
        const { error: subError } = await supabase.from('task_subtasks').insert(
          subtasks.map((s, i) => ({
            task_assignment_id: task.id,
            title: s.title,
            assignee_id: s.assignee_id || null,
            estimated_duration_minutes: s.estimated_minutes || null,
            order_index: i,
          })),
        )
        if (subError) throw subError
      }

      return task
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      navigate(`/tasks/${task.id}`)
    },
  })

  const addSubtask = () => {
    if (!subtaskTitle.trim()) return
    setSubtasks((prev) => [
      ...prev,
      { title: subtaskTitle.trim(), assignee_id: '', estimated_minutes: 0 },
    ])
    setSubtaskTitle('')
  }

  const removeSubtask = (index: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tasks')}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Create Task</h1>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Issue description"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm resize-y"
                placeholder="Details about this task..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="flex h-8 w-full rounded-lg border bg-background px-3 text-sm"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">SKP Category</label>
              <select
                value={skpCategoryId}
                onChange={(e) => setSkpCategoryId(e.target.value)}
                className="flex h-8 w-full rounded-lg border bg-background px-3 text-sm"
              >
                <option value="">None</option>
                {skpCategories?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.kode} â€” {c.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subtasks */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground">Subtasks</label>
            {subtasks.map((st, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg border">
                <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-sm">{st.title}</span>
                <Button variant="ghost" size="icon-xs" onClick={() => removeSubtask(i)}>
                  <X className="size-3" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Add subtask..."
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
              />
              <Button variant="outline" size="sm" onClick={addSubtask}>
                <Plus className="mr-1 size-3" /> Add
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => navigate('/tasks')}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !title}
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              Create Task
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
