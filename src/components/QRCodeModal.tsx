import { useEffect, useState } from 'react'
import QRCodeLib from 'qrcode'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Download, Loader2 } from 'lucide-react'

interface QRCodeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deviceId: string
  deviceName: string
}

const QR_BASE_URL = 'https://app.atlas/devices'

export function QRCodeModal({ open, onOpenChange, deviceId, deviceName }: QRCodeModalProps) {
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    if (!open || !deviceId) return
    const url = `${QR_BASE_URL}/${deviceId}`
    QRCodeLib.toDataURL(url, {
      width: 400,
      margin: 2,
      color: { dark: '#000', light: '#fff' },
    }).then(setDataUrl)
  }, [open, deviceId])

  const generating = open && !dataUrl

  const handleDownload = () => {
    const link = document.createElement('a')
    link.download = `${deviceName.replace(/\s+/g, '-')}-QR.png`
    link.href = dataUrl
    link.click()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{deviceName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {generating ? (
            <Loader2 className="size-12 animate-spin text-muted-foreground" />
          ) : dataUrl ? (
            <>
              <img src={dataUrl} alt={`QR for ${deviceName}`} className="size-48" />
              <p className="text-xs text-muted-foreground font-mono break-all text-center">
                {QR_BASE_URL}/{deviceId}
              </p>
              <Button size="sm" onClick={handleDownload}>
                <Download className="mr-2 size-4" />
                Download PNG
              </Button>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
