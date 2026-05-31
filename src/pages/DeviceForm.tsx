import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function DeviceForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDelete, setShowDelete] = useState(false)

  const [form, setForm] = useState({
    nama_perangkat: '',
    serial_number: '',
    jenis_perangkat_kode: '',
    jenis_barang_id: '',
    lokasi_kode: '',
    merk: '',
    spesifikasi_processor: '',
    kapasitas_ram: '',
    ip_ethernet: '',
    ip_wireless: '',
    mac_ethernet: '',
    mac_wireless: '',
    serial_number_monitor: '',
    status_perangkat: 'layak',
    id_remoteaccess: '',
  })

  // Load existing data for edit
  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['device', id],
    enabled: isEdit,
    queryFn: async () => {
      const { data } = await supabase.from('perangkat').select('*').eq('id', id).single()
      return data
    },
  })

  useEffect(() => {
    if (existing) {
      setForm((prev) => ({ ...prev, ...existing }))
    }
  }, [existing])

  // Reference data
  const { data: deviceTypes } = useQuery({
    queryKey: ['device-types'],
    queryFn: async () => {
      const { data } = await supabase.from('ms_jenis_perangkat').select('*').is('deleted_at', null)
      return data ?? []
    },
  })
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data } = await supabase.from('ms_lokasi').select('*').is('deleted_at', null)
      return data ?? []
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        const { error } = await supabase.from('perangkat').update(form).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('perangkat').insert(form)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      navigate('/devices')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('perangkat')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      navigate('/devices')
    },
  })

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }))

  if (isEdit && loadingExisting) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/devices')}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? 'Edit Device' : 'Add Device'}</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Device Name *"
              value={form.nama_perangkat}
              onChange={(v) => update('nama_perangkat', v)}
              required
            />
            <Field
              label="Serial Number"
              value={form.serial_number}
              onChange={(v) => update('serial_number', v)}
            />
            <SelectField
              label="Type"
              value={form.jenis_perangkat_kode}
              onChange={(v) => update('jenis_perangkat_kode', v)}
              options={deviceTypes?.map((t) => ({ value: t.kode, label: t.nama })) ?? []}
              placeholder="Select type"
            />
            <Field label="Brand" value={form.merk} onChange={(v) => update('merk', v)} />
            <SelectField
              label="Status"
              value={form.status_perangkat}
              onChange={(v) => update('status_perangkat', v)}
              options={[
                { value: 'layak', label: 'Layak' },
                { value: 'rusak', label: 'Rusak' },
                { value: 'dipinjam', label: 'Dipinjam' },
                { value: 'dihapus', label: 'Dihapus' },
              ]}
            />
            <SelectField
              label="Location"
              value={form.lokasi_kode}
              onChange={(v) => update('lokasi_kode', v)}
              options={
                locations?.map((l) => ({ value: l.kode, label: `${l.kode} â€” ${l.nama}` })) ?? []
              }
              placeholder="Select location"
            />
            <Field
              label="Processor"
              value={form.spesifikasi_processor}
              onChange={(v) => update('spesifikasi_processor', v)}
            />
            <Field
              label="RAM"
              value={form.kapasitas_ram}
              onChange={(v) => update('kapasitas_ram', v)}
            />
            <Field
              label="IP (Ethernet)"
              value={form.ip_ethernet}
              onChange={(v) => update('ip_ethernet', v)}
              placeholder="192.168.1.1"
            />
            <Field
              label="IP (Wireless)"
              value={form.ip_wireless}
              onChange={(v) => update('ip_wireless', v)}
            />
            <Field
              label="MAC (Ethernet)"
              value={form.mac_ethernet}
              onChange={(v) => update('mac_ethernet', v)}
              placeholder="AA:BB:CC:DD:EE:FF"
            />
            <Field
              label="MAC (Wireless)"
              value={form.mac_wireless}
              onChange={(v) => update('mac_wireless', v)}
            />
            <Field
              label="Monitor SN"
              value={form.serial_number_monitor}
              onChange={(v) => update('serial_number_monitor', v)}
            />
            <Field
              label="Remote Access ID"
              value={form.id_remoteaccess}
              onChange={(v) => update('id_remoteaccess', v)}
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            {isEdit && (
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate('/devices')}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.nama_perangkat}
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              {isEdit ? 'Save Changes' : 'Create Device'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Device</DialogTitle>
            <DialogDescription>
              This will soft-delete the device. It will no longer appear in listings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteMutation.mutate()
                setShowDelete(false)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-8 w-full rounded-lg border bg-background px-3 py-1 text-sm"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
