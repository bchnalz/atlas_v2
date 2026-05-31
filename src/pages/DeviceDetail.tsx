import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Edit, QrCode } from 'lucide-react'

const statusColors: Record<string, string> = {
  layak: 'bg-green-500/10 text-green-600 dark:text-green-400',
  rusak: 'bg-red-500/10 text-red-600 dark:text-red-400',
  dipinjam: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  dihapus: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
}

export default function DeviceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: device, isLoading } = useQuery({
    queryKey: ['device', id],
    queryFn: async () => {
      const { data } = await supabase.from('perangkat').select('*').eq('id', id).single()
      return data
    },
  })

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!device) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Device not found</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/devices')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{device.nama_perangkat}</h1>
          <p className="text-xs text-muted-foreground font-mono">
            {device.serial_number ?? 'No serial'}
          </p>
        </div>
        <Badge className={`rounded-full ${statusColors[device.status_perangkat] ?? ''}`}>
          {device.status_perangkat}
        </Badge>
        <Button variant="outline" size="sm" onClick={() => navigate(`/devices/${id}/edit`)}>
          <Edit className="mr-2 size-4" />
          Edit
        </Button>
        <Button variant="outline" size="sm">
          <QrCode className="mr-2 size-4" />
          QR Code
        </Button>
      </div>

      {/* Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Type" value={device.jenis_perangkat_kode} />
            <Row label="Item Type" value={device.jenis_barang_id} />
            <Row label="Brand" value={device.merk} />
            <Row label="Processor" value={device.spesifikasi_processor} />
            <Row label="RAM" value={device.kapasitas_ram} />
            <Row label="Monitor SN" value={device.serial_number_monitor} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Network</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="IP (Ethernet)" value={device.ip_ethernet} />
            <Row label="IP (Wireless)" value={device.ip_wireless} />
            <Row label="MAC (Ethernet)" value={device.mac_ethernet} />
            <Row label="MAC (Wireless)" value={device.mac_wireless} />
            <Row label="Remote Access" value={device.id_remoteaccess} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Location Code" value={device.lokasi_kode} />
            <Row
              label="Entry Date"
              value={
                device.tanggal_entry ? new Date(device.tanggal_entry).toLocaleDateString() : 'â€”'
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Assigned To" value={device.petugas_id ?? 'Unassigned'} />
          </CardContent>
        </Card>
      </div>

      {/* Service History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Service History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Service history coming in Sprint 3.</p>
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-right truncate">{value ?? 'â€”'}</span>
    </div>
  )
}
