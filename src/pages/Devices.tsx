import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, MoreHorizontal, Plus, ChevronLeft, ChevronRight, ScanLine } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { QRScannerModal } from '@/components/QRScannerModal'

const PAGE_SIZE = 20

const statusColors: Record<string, string> = {
  layak: 'bg-green-500/10 text-green-600 dark:text-green-400',
  rusak: 'bg-red-500/10 text-red-600 dark:text-red-400',
  dipinjam: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  dihapus: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
}

const typeFilter = ['all', 'KOMP', 'PRIN', 'NET', 'UPS', 'MON']
const statusFilter = ['all', 'layak', 'rusak', 'dipinjam', 'dihapus']

export default function Devices() {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(0)
  const [showScanner, setShowScanner] = useState(false)
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: ['devices', search, type, status, page],
    queryFn: async () => {
      let q = supabase
        .from('perangkat')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (search) {
        q = q.or(
          `nama_perangkat.ilike.%${search}%,serial_number.ilike.%${search}%,ip_ethernet.ilike.%${search}%,mac_ethernet.ilike.%${search}%`,
        )
      }
      if (type !== 'all') q = q.eq('jenis_perangkat_kode', type)
      if (status !== 'all') q = q.eq('status_perangkat', status)

      const { data, count } = await q
      return { devices: data ?? [], total: count ?? 0 }
    },
  })

  const totalPages = Math.ceil(query.data?.total ?? 0 / PAGE_SIZE)

  return (
    <div className="p-6">
      {/* Title + Actions */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Devices</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowScanner(true)}>
            <ScanLine className="mr-2 size-4" />
            Scan QR
          </Button>
          <Button onClick={() => navigate('/devices/new')}>
            <Plus className="mr-2 size-4" />
            Add Device
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, serial, IP, MAC..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            className="pl-9"
          />
        </div>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value)
            setPage(0)
          }}
          className="h-8 rounded-lg border bg-background px-3 text-xs"
        >
          <option value="all">All Types</option>
          {typeFilter
            .filter((t) => t !== 'all')
            .map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(0)
          }}
          className="h-8 rounded-lg border bg-background px-3 text-xs"
        >
          <option value="all">All Status</option>
          {statusFilter
            .filter((s) => s !== 'all')
            .map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : query.data?.devices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                  No devices found
                </TableCell>
              </TableRow>
            ) : (
              query.data?.devices.map((device: any) => (
                <TableRow
                  key={device.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/devices/${device.id}`)}
                >
                  <TableCell className="font-medium">{device.nama_perangkat}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {device.serial_number ?? 'â€”'}
                  </TableCell>
                  <TableCell>{device.jenis_perangkat_kode ?? 'â€”'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {device.lokasi_kode ?? 'â€”'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`rounded-full ${statusColors[device.status_perangkat] ?? ''}`}
                    >
                      {device.status_perangkat}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon-xs">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/devices/${device.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/devices/${device.id}/edit`)}>
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {query.data && query.data.total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}â€“{Math.min((page + 1) * PAGE_SIZE, query.data.total)} of{' '}
            {query.data.total}
          </p>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="xs"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="xs"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <QRScannerModal open={showScanner} onOpenChange={setShowScanner} />
    </div>
  )
}
