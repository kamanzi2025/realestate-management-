'use client'

import { useState } from 'react'
import { updateTenantInfo } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  tenantId: string
  currentName: string
  currentEmail: string
  currentPhone: string | null
}

export function EditTenantDialog({ tenantId, currentName, currentEmail, currentPhone }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await updateTenantInfo(tenantId, {
      fullName: (fd.get('full_name') as string).trim(),
      email:    (fd.get('email')     as string).trim(),
      phone:    ((fd.get('phone')    as string).trim()) || null,
    })
    setLoading(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Tenant info updated')
      setOpen(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-slate-400 hover:text-slate-700 transition-colors"
        title="Edit tenant info"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Tenant Info</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Full name *</Label>
              <Input name="full_name" defaultValue={currentName} required />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input name="email" type="email" defaultValue={currentEmail} required />
              <p className="text-xs text-slate-400">This is also used to sign in to the portal.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input name="phone" type="tel" defaultValue={currentPhone ?? ''} placeholder="+1 555 000 0000" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
