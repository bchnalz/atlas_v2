import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Camera, X } from 'lucide-react'

interface QRScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QRScannerModal({ open, onOpenChange }: QRScannerProps) {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scanning, setScanning] = useState(false)
  const [manualId, setManualId] = useState('')
  const [error, setError] = useState('')
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!open) {
      // Stop camera when dialog closes
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      setScanning(false)
      return
    }
  }, [open])

  const startCamera = async () => {
    setError('')
    setScanning(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // Poll for QR codes every 500ms using a simple approach
      // For production use a proper QR scanner lib like @yudiel/react-qr-scanner
      const checkInterval = setInterval(async () => {
        if (!videoRef.current || !stream.active) {
          clearInterval(checkInterval)
          return
        }
        // In production: use jsQR or similar to decode from canvas
        // Here we redirect to a simple approach - QR contains URL like https://app.atlas/devices/{id}
        // The user scans and the URL triggers navigation
      }, 500)
    } catch (err) {
      setError('Camera access denied. Use manual entry instead.')
      setScanning(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setScanning(false)
  }

  const handleManualSubmit = () => {
    const id = manualId.trim()
    if (!id) return
    const match = id.match(/\/devices\/([a-f0-9-]+)/i) || id.match(/^([a-f0-9-]{36})$/)
    if (match) {
      onOpenChange(false)
      navigate(`/devices/${match[1]}`)
    } else {
      setError('Invalid QR data. Scan a valid device QR code or enter the device ID.')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) stopCamera()
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {scanning ? (
            <div className="relative rounded-lg overflow-hidden bg-muted aspect-square max-h-64">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={stopCamera}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full h-24 flex-col gap-2" onClick={startCamera}>
              <Camera className="size-8" />
              <span className="text-xs">Open Camera</span>
            </Button>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Or enter manually</label>
            <div className="flex gap-2">
              <Input
                placeholder="Device ID or QR URL"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
              <Button size="sm" onClick={handleManualSubmit}>
                Go
              </Button>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
