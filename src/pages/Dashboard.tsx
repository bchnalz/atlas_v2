import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import { Monitor, ListTodo, CheckCircle, TrendingUp } from 'lucide-react'

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7', '#06b6d4']

export default function Dashboard() {
  const [period, setPeriod] = useState('30')

  const { data: counts } = useQuery({
    queryKey: ['d-counts'],
    queryFn: async () => {
      const { count: td } = await supabase
        .from('perangkat')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
      const { count: tt } = await supabase
        .from('task_assignments')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
      const { count: co } = await supabase
        .from('task_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
      const { count: ac } = await supabase
        .from('task_assignments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['accepted', 'in_progress'])
      return { td: td ?? 0, tt: tt ?? 0, co: co ?? 0, ac: ac ?? 0 }
    },
    refetchInterval: 30000,
  })

  const { data: trend } = useQuery({
    queryKey: ['d-trend', period],
    queryFn: async () => {
      const days = parseInt(period)
      const since = new Date()
      since.setDate(since.getDate() - days)
      const { data } = await supabase
        .from('task_assignments')
        .select('completed_at')
        .eq('status', 'completed')
        .gte('completed_at', since.toISOString())
      const m: Record<string, number> = {}
      for (let i = 0; i < days; i++) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        m[d.toISOString().slice(0, 10)] = 0
      }
      data?.forEach((t: any) => {
        if (t.completed_at)
          m[t.completed_at.slice(0, 10)] = (m[t.completed_at.slice(0, 10)] ?? 0) + 1
      })
      return Object.entries(m)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([d, c]) => ({ date: d.slice(5), count: c }))
    },
  })

  const { data: devDist } = useQuery({
    queryKey: ['d-dev'],
    queryFn: async () => {
      const { data } = await supabase
        .from('perangkat')
        .select('jenis_perangkat_kode')
        .is('deleted_at', null)
      const m: Record<string, number> = {}
      data?.forEach((d: any) => {
        const k = d.jenis_perangkat_kode ?? 'X'
        m[k] = (m[k] ?? 0) + 1
      })
      return Object.entries(m).map(([n, v]) => ({ name: n, value: v }))
    },
  })

  const { data: skp } = useQuery({
    queryKey: ['d-skp'],
    queryFn: async () => {
      const { data } = await supabase
        .from('skp_achievements')
        .select('*, profiles!user_id(full_name)')
        .eq('year', new Date().getFullYear())
      return (
        data?.map((d: any) => ({
          name: d.profiles?.full_name?.split(' ')[0] ?? '?',
          target: d.target_count,
          completed: d.completed_count,
        })) ?? []
      )
    },
  })

  const isLoading = !counts && !trend && !devDist && !skp
  const rate = counts && counts.tt > 0 ? Math.round((counts.co / counts.tt) * 100) : 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="h-8 rounded-lg border bg-background px-3 text-xs"
        >
          <option value="7">7 days</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <SC icon={Monitor} label="Devices" value={String(counts?.td ?? 0)} />
            <SC
              icon={ListTodo}
              label="Active Tasks"
              value={String(counts?.ac ?? 0)}
              color="text-blue-500"
            />
            <SC
              icon={CheckCircle}
              label="Completed"
              value={String(counts?.co ?? 0)}
              color="text-green-500"
            />
            <SC
              icon={TrendingUp}
              label="Rate"
              value={`${rate}%`}
              color={
                rate >= 75 ? 'text-green-500' : rate >= 50 ? 'text-yellow-500' : 'text-red-500'
              }
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Task Completion Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trend ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trend}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-48 w-full" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Device by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {devDist ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={devDist}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name }) => name}
                  >
                    {devDist.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-48 w-full" />
            )}
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">SKP Target vs Actuals</CardTitle>
          </CardHeader>
          <CardContent>
            {skp ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={skp}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="target" fill="#6b7280" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-48 w-full" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SC({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any
  label: string
  value: string
  color?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`size-4 ${color ?? 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent className="pt-0">
        <p className={`text-2xl font-semibold ${color ?? ''}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
