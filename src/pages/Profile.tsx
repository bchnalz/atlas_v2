import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { Save, Loader2, Check } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function Profile() {
  const { user, loading, loadProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(user?.profile?.full_name ?? '')
  const [phone, setPhone] = useState(user?.profile?.phone ?? '')
  const [department, setDepartment] = useState(user?.profile?.department ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone, department })
      .eq('id', user!.id)
    if (!error) {
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2000)
      await loadProfile(user!.id, user!.email)
    }
    setSaving(false)
  }

  const handleCancel = () => {
    setFullName(user?.profile?.full_name ?? '')
    setPhone(user?.profile?.phone ?? '')
    setDepartment(user?.profile?.department ?? '')
    setEditing(false)
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!editing}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input value={user?.email ?? ''} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Phone</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!editing}
                  placeholder="+62..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Department</label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={!editing}
                  placeholder="IT Support"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              {editing ? (
                <>
                  <Button variant="ghost" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : saved ? (
                      <Check className="mr-2 size-4" />
                    ) : (
                      <Save className="mr-2 size-4" />
                    )}
                    Save
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditing(true)}>Edit</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Role</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium capitalize">{user?.userCategory?.nama ?? '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {user?.userCategory?.is_admin ? 'Full system access' : 'Limited access'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            {user?.profile?.capabilities && user.profile.capabilities.length > 0 ? (
              <ul className="space-y-1">
                {user.profile.capabilities.map((cap) => (
                  <li key={cap} className="text-sm text-muted-foreground">
                    • {cap.replace('_', ' ')}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No additional capabilities</p>
            )}
          </CardContent>
        </Card>

        {/* Telegram */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Telegram</CardTitle>
          </CardHeader>
          <CardContent>
            {user?.profile?.telegram_id ? (
              <p className="text-sm text-muted-foreground">Connected</p>
            ) : (
              <p className="text-sm text-muted-foreground">Not connected</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
