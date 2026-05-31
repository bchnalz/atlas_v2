import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Edit, QrCode, ScanLine, ArrowRightLeft } from 'lucide-react'
import { QRCodeModal } from '@/components/QRCodeModal'
import { QRScannerModal } from '@/components/QRScannerModal'
import { useState } from 'react'

const statusColors: Record<string, string> = {
  layak: 'bg-green-500/10 text-green-600 dark:text-green-400',
  rusak: 'bg-red-500/10 text-red-600 dark:text-red-400',
  dipinjam: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  dihapus: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
}

export default function DeviceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [showQr, setShowQr] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  const {
    data: device,
    isLoading,
    isError,
  } = useQuery({
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

  if (isError) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-destructive mb-4">Failed to load device details.</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Retry
        </Button>
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
        <Button variant="outline" size="sm" onClick={() => setShowQr(true)}>
          <QrCode className="mr-2 size-4" />
          QR Code
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate(`/devices/${id}/transfer`)}>
          <ArrowRightLeft className="mr-2 size-4" />
          Transfer
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowScanner(true)}>
          <ScanLine className="mr-2 size-4" />
          Scan
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
      <ServiceHistory deviceId={device.id} />
      <QRCodeModal
        open={showQr}
        onOpenChange={setShowQr}
        deviceId={device.id}
        deviceName={device.nama_perangkat}
      />
      <QRScannerModal open={showScanner} onOpenChange={setShowScanner} />
    </div>
  )
}

function ServiceHistory({ deviceId }: { deviceId: string }) {
  const { data: history } = useQuery({
    queryKey: ['device-service-history', deviceId],
    queryFn: async () => {
      // Get completed tasks linked to this device via task_assignment_devices
      const { data: tasks } = await supabase
        .from('task_assignment_devices')
        .select(
          `
          task_assignments!inner(id, task_number, title, completed_at, completion_notes, status),
          linked_during_execution
        `,
        )
        .eq('perangkat_id', deviceId)
        .not('task_assignments.completed_at', 'is', null)
        .order('task_assignments.completed_at', { ascending: false })
        .limit(20)

      // Also get mutation records
      const { data: mutations } = await supabase
        .from('mutasi_perangkat')
        .select(
          '*, ms_lokasi!lokasi_lama(kode, nama), ms_lokasi!lokasi_baru(kode, nama), profiles!dilakukan_oleh(full_name)',
        )
        .eq('perangkat_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(10)

      return { tasks: tasks ?? [], mutations: mutations ?? [] }
    },
  })

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base">Service History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {history?.tasks.length === 0 && history?.mutations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No service history for this device</p>
        ) : (
          <>
            {history?.tasks.map((t: any) => (
              <div
                key={t.task_assignments.id}
                className="flex items-start gap-3 text-sm py-1 border-b last:border-0"
              >
                <div className="flex-1">
                  <p className="font-medium">{t.task_assignments.title}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {t.task_assignments.task_number}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.task_assignments.completed_at
                    ? new Date(t.task_assignments.completed_at).toLocaleDateString()
                    : ''}
                </p>
              </div>
            ))}
            {history?.mutations.map((m: any) => (
              <div
                key={m.id}
                className="flex items-start gap-3 text-sm py-1 border-b last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm">
                    Moved: {m.ms_lokasi?.lokasi_lama?.kode} → {m.ms_lokasi?.lokasi_baru?.kode}
                  </p>
                  {m.alasan && <p className="text-xs text-muted-foreground">{m.alasan}</p>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(m.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
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
