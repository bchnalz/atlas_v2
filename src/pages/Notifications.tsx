import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Notifications() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'unread'>('unread')

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return []
      let q = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(50)
      if (filter === 'unread') q = q.eq('is_read', false)
      const { data } = await q
      return data ?? []
    },
    refetchInterval: 15000,
  })

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllRead = useMutation({
    mutationFn: async () => {
      const uid = (await supabase.auth.getUser()).data.user?.id
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', uid)
        .eq('is_read', false)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unreadCount = data?.filter((n) => !n.is_read).length ?? 0

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${filter === 'unread' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
            >
              All
            </button>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="xs" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="mr-1 size-3" /> Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
        ) : data?.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Bell className="size-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        ) : (
          data?.map((n: any) => (
            <Card
              key={n.id}
              className={`cursor-pointer transition-colors hover:bg-accent/50 ${!n.is_read ? 'border-l-2 border-l-primary' : ''}`}
              onClick={() => {
                if (!n.is_read) markRead.mutate(n.id)
                if (n.link) navigate(n.link)
              }}
            >
              <CardContent className="flex items-start gap-3 py-3">
                <div
                  className={`mt-1 size-2 shrink-0 rounded-full ${!n.is_read ? 'bg-primary' : 'bg-transparent'}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleString('en-ID', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {n.link && <ExternalLink className="size-3 text-muted-foreground shrink-0 mt-1" />}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
