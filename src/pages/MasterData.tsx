import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { MasterTable } from '@/components/MasterTable'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { TableCell } from '@/components/ui/table'
import { ArrowLeft } from 'lucide-react'

const tabs = [
  { label: 'SKP Categories', path: 'skp-categories' },
  { label: 'Locations', path: 'locations' },
  { label: 'Device Types', path: 'device-types' },
  { label: 'Item Types', path: 'item-types' },
]

export default function MasterData() {
  const navigate = useNavigate()
  const location = useLocation()
  const tab = location.pathname.split('/').pop()

  const renderContent = () => {
    switch (tab) {
      case 'skp-categories':
        return <SkpCategories />
      case 'locations':
        return <Locations />
      case 'device-types':
        return <DeviceTypes />
      case 'item-types':
        return <ItemTypes />
      default:
        return <SkpCategories />
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Master Data</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {tabs.map((t) => (
          <button
            key={t.path}
            onClick={() => navigate(`/master/${t.path}`)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              tab === t.path
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {renderContent()}
    </div>
  )
}

function SkpCategories() {
  return (
    <MasterTable
      title="SKP Categories"
      queryKey={['master', 'skp-categories']}
      columns={[
        { key: 'kode', label: 'Code' },
        { key: 'nama', label: 'Name' },
        { key: 'deskripsi', label: 'Description' },
      ]}
      fetchFn={async () => {
        const { data } = await supabase
          .from('skp_categories')
          .select('*')
          .is('deleted_at', null)
          .order('kode')
        return data ?? []
      }}
      createFn={async (data) => {
        await supabase.from('skp_categories').insert(data)
      }}
      updateFn={async (id, data) => {
        await supabase.from('skp_categories').update(data).eq('id', id)
      }}
      deleteFn={async (id) => {
        await supabase
          .from('skp_categories')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
      }}
      fields={[
        { key: 'kode', label: 'Code', required: true },
        { key: 'nama', label: 'Name', required: true },
        { key: 'deskripsi', label: 'Description' },
      ]}
      rowRender={(item: any) => (
        <>
          <TableCell className="font-mono text-xs">{item.kode}</TableCell>
          <TableCell className="font-medium">{item.nama}</TableCell>
          <TableCell className="text-xs text-muted-foreground">{item.deskripsi ?? '—'}</TableCell>
        </>
      )}
    />
  )
}

function Locations() {
  return (
    <MasterTable
      title="Locations"
      queryKey={['master', 'locations']}
      columns={[
        { key: 'kode', label: 'Code' },
        { key: 'nama', label: 'Name' },
        { key: 'parent_id', label: 'Parent' },
      ]}
      fetchFn={async () => {
        const { data } = await supabase
          .from('ms_lokasi')
          .select('*')
          .is('deleted_at', null)
          .order('kode')
        return data ?? []
      }}
      createFn={async (data) => {
        await supabase.from('ms_lokasi').insert(data)
      }}
      updateFn={async (id, data) => {
        await supabase.from('ms_lokasi').update(data).eq('id', id)
      }}
      deleteFn={async (id) => {
        await supabase
          .from('ms_lokasi')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
      }}
      fields={[
        { key: 'kode', label: 'Code', required: true },
        { key: 'nama', label: 'Name', required: true },
        { key: 'parent_id', label: 'Parent Code' },
      ]}
      rowRender={(item: any) => (
        <>
          <TableCell className="font-mono text-xs">{item.kode}</TableCell>
          <TableCell className="font-medium">{item.nama}</TableCell>
          <TableCell className="text-xs text-muted-foreground">{item.parent_id ?? '—'}</TableCell>
        </>
      )}
    />
  )
}

function DeviceTypes() {
  return (
    <MasterTable
      title="Device Types"
      queryKey={['master', 'device-types']}
      columns={[
        { key: 'kode', label: 'Code' },
        { key: 'nama', label: 'Name' },
      ]}
      fetchFn={async () => {
        const { data } = await supabase
          .from('ms_jenis_perangkat')
          .select('*')
          .is('deleted_at', null)
          .order('kode')
        return data ?? []
      }}
      createFn={async (data) => {
        await supabase.from('ms_jenis_perangkat').insert(data)
      }}
      updateFn={async (id, data) => {
        await supabase.from('ms_jenis_perangkat').update(data).eq('id', id)
      }}
      deleteFn={async (id) => {
        await supabase
          .from('ms_jenis_perangkat')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
      }}
      fields={[
        { key: 'kode', label: 'Code', required: true },
        { key: 'nama', label: 'Name', required: true },
      ]}
      rowRender={(item: any) => (
        <>
          <TableCell className="font-mono text-xs">{item.kode}</TableCell>
          <TableCell className="font-medium">{item.nama}</TableCell>
        </>
      )}
    />
  )
}

function ItemTypes() {
  return (
    <MasterTable
      title="Item Types"
      queryKey={['master', 'item-types']}
      columns={[
        { key: 'kode', label: 'Code' },
        { key: 'nama', label: 'Name' },
        { key: 'jenis_perangkat_kode', label: 'Device Type' },
      ]}
      fetchFn={async () => {
        const { data } = await supabase
          .from('ms_jenis_barang')
          .select('*')
          .is('deleted_at', null)
          .order('kode')
        return data ?? []
      }}
      createFn={async (data) => {
        await supabase.from('ms_jenis_barang').insert(data)
      }}
      updateFn={async (id, data) => {
        await supabase.from('ms_jenis_barang').update(data).eq('id', id)
      }}
      deleteFn={async (id) => {
        await supabase
          .from('ms_jenis_barang')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
      }}
      fields={[
        { key: 'kode', label: 'Code', required: true },
        { key: 'nama', label: 'Name', required: true },
        { key: 'jenis_perangkat_kode', label: 'Device Type Code', required: true },
      ]}
      rowRender={(item: any) => (
        <>
          <TableCell className="font-mono text-xs">{item.kode}</TableCell>
          <TableCell className="font-medium">{item.nama}</TableCell>
          <TableCell className="text-xs text-muted-foreground">
            {item.jenis_perangkat_kode ?? '—'}
          </TableCell>
        </>
      )}
    />
  )
}
