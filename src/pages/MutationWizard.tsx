import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Loader2, Monitor } from 'lucide-react'

export default function MutationWizard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedLocation, setSelectedLocation] = useState('')
  const [reason, setReason] = useState('')

  const { data: device } = useQuery({
    queryKey: ['device', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('perangkat')
        .select('*, ms_lokasi!lokasi_kode(kode, nama)')
        .eq('id', id)
        .single()
      return data
    },
  })

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ms_lokasi')
        .select('*')
        .is('deleted_at', null)
        .order('kode')
      return data ?? []
    },
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const uid = (await supabase.auth.getUser()).data.user?.id
      await supabase.from('perangkat').update({ lokasi_kode: selectedLocation }).eq('id', id)
      await supabase.from('mutasi_perangkat').insert({
        perangkat_id: id,
        lokasi_lama: device?.lokasi_kode,
        lokasi_baru: selectedLocation,
        alasan: reason,
        dilakukan_oleh: uid,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', id] })
      navigate(`/devices/${id}`)
    },
  })

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/devices/${id}`)}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Transfer Device</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            <Monitor className="inline size-4 mr-2" />
            {device?.nama_perangkat ?? 'Loading...'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Current Location</label>
              <p className="text-sm font-medium">
                {device?.ms_lokasi?.kode} — {device?.ms_lokasi?.nama}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">New Location *</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="flex h-8 w-full rounded-lg border bg-background px-3 text-sm"
              >
                <option value="">Select location...</option>
                {locations?.map((l: any) => (
                  <option key={l.id} value={l.kode}>
                    {l.kode} — {l.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="flex min-h-16 w-full rounded-lg border bg-background px-3 py-2 text-sm resize-y"
              placeholder="Why is this device being transferred?"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => navigate(`/devices/${id}`)}>
              Cancel
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !selectedLocation}
            >
              {mutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              Transfer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
