import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, FileSpreadsheet } from 'lucide-react'

export default function ExportPage() {
  const exportDevices = async () => {
    const { data } = await supabase.from('perangkat').select('*').is('deleted_at', null)
    if (!data?.length) return
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(
      data.map((d) => ({
        Name: d.nama_perangkat,
        'Serial Number': d.serial_number,
        Type: d.jenis_perangkat_kode,
        Location: d.lokasi_kode,
        Brand: d.merk,
        'IP Ethernet': d.ip_ethernet,
        'MAC Ethernet': d.mac_ethernet,
        Status: d.status_perangkat,
      })),
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Devices')
    XLSX.writeFile(wb, 'devices-export.xlsx')
  }

  const exportTasks = async () => {
    const { data } = await supabase.from('task_assignments').select('*').is('deleted_at', null)
    if (!data?.length) return
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(
      data.map((d) => ({
        'Task Number': d.task_number,
        Title: d.title,
        Priority: d.priority,
        Status: d.status,
        'Created At': d.created_at ? new Date(d.created_at).toISOString() : '',
        'Completed At': d.completed_at ? new Date(d.completed_at).toISOString() : '',
      })),
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks')
    XLSX.writeFile(wb, 'tasks-export.xlsx')
  }

  const exportSkp = async () => {
    const { data } = await supabase
      .from('skp_achievements')
      .select('*, profiles!user_id(full_name), skp_categories!skp_category_id(kode, nama)')
    if (!data?.length) return
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(
      data.map((d: any) => ({
        User: d.profiles?.full_name ?? 'Unknown',
        'SKP Code': d.skp_categories?.kode ?? '',
        'SKP Name': d.skp_categories?.nama ?? '',
        Target: d.target_count,
        Completed: d.completed_count,
        'Achievement %':
          d.target_count > 0 ? Math.round((d.completed_count / d.target_count) * 100) : 0,
        Year: d.year,
      })),
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'SKP Report')
    XLSX.writeFile(wb, 'skp-report.xlsx')
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Export Data</h1>
      <div className="grid grid-cols-1 gap-4">
        <Card
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={exportDevices}
        >
          <CardHeader className="flex-row items-center gap-4">
            <FileSpreadsheet className="size-8 text-primary" />
            <div>
              <CardTitle className="text-base">Export Devices</CardTitle>
              <p className="text-xs text-muted-foreground">
                All devices with specs, network info, and status
              </p>
            </div>
            <Download className="size-4 ml-auto text-muted-foreground" />
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={exportTasks}>
          <CardHeader className="flex-row items-center gap-4">
            <FileSpreadsheet className="size-8 text-primary" />
            <div>
              <CardTitle className="text-base">Export Tasks</CardTitle>
              <p className="text-xs text-muted-foreground">
                All tasks with priority, status, and dates
              </p>
            </div>
            <Download className="size-4 ml-auto text-muted-foreground" />
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={exportSkp}>
          <CardHeader className="flex-row items-center gap-4">
            <FileSpreadsheet className="size-8 text-primary" />
            <div>
              <CardTitle className="text-base">Export SKP Report</CardTitle>
              <p className="text-xs text-muted-foreground">
                Per-user SKP targets vs actuals with achievement %
              </p>
            </div>
            <Download className="size-4 ml-auto text-muted-foreground" />
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
