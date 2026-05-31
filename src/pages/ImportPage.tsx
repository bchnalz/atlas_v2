import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader } from '@/components/ui/card'
import { Upload, Loader2, Check, AlertCircle } from 'lucide-react'

export default function ImportPage() {
  const queryClient = useQueryClient()
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setResult(null)

    try {
      const XLSX = await import('xlsx')
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(ws)

      let success = 0
      const errors: string[] = []

      for (const row of rows) {
        if (!row.Name && !row.nama_perangkat) {
          errors.push(`Row ${success + errors.length + 1}: missing name`)
          continue
        }
        const { error } = await supabase.from('perangkat').insert({
          nama_perangkat: row.Name || row.nama_perangkat,
          serial_number: row['Serial Number'] || row.serial_number || null,
          jenis_perangkat_kode: row.Type || row.jenis_perangkat_kode || null,
          lokasi_kode: row.Location || row.lokasi_kode || null,
          merk: row.Brand || row.merk || null,
          status_perangkat: row.Status || row.status_perangkat || 'layak',
          ip_ethernet: row['IP Ethernet'] || row.ip_ethernet || null,
          mac_ethernet: row['MAC Ethernet'] || row.mac_ethernet || null,
        })
        if (error) {
          errors.push(`${row.Name || row.nama_perangkat}: ${error.message}`)
        } else {
          success++
        }
      }

      setResult({ success, errors })
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    } catch (err) {
      setResult({ success: 0, errors: [(err as Error).message] })
    }
    setImporting(false)
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-2">Import Devices</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Upload an Excel file (.xlsx) with columns: Name, Serial Number, Type, Location, Brand,
        Status, IP Ethernet, MAC Ethernet
      </p>

      <Card className="relative">
        <CardHeader>
          <label className="cursor-pointer flex flex-col items-center gap-3 py-8">
            <Upload className="size-10 text-muted-foreground" />
            <span className="text-sm font-medium">
              {importing ? 'Importing...' : 'Click to upload or drag Excel file here'}
            </span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFile}
              disabled={importing}
              className="hidden"
            />
          </label>
        </CardHeader>
      </Card>

      {importing && (
        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Processing...
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Check className="size-4 text-green-500" />
            <span>{result.success} devices imported successfully</span>
          </div>
          {result.errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-destructive">
              <AlertCircle className="size-3 mt-0.5 shrink-0" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
