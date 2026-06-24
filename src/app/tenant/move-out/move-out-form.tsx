'use client'

import { useState } from 'react'
import { submitMoveOutNotice } from '@/app/actions/move-out'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export function MoveOutForm() {
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date) { toast.error('Please select a move-out date'); return }
    setSubmitting(true)
    const fd = new FormData()
    fd.append('move_out_date', date)
    if (reason) fd.append('reason', reason)
    const result = await submitMoveOutNotice(fd)
    setSubmitting(false)
    if (result?.error) toast.error(result.error)
    else toast.success('Move-out notice submitted!')
  }

  // Minimum 30 days from today
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 30)
  const minDateStr = minDate.toISOString().split('T')[0]

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Submit Move-out Notice</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="date">Intended move-out date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              min={minDateStr}
              required
            />
            <p className="text-xs text-slate-400">Must be at least 30 days from today</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Moving to a larger space, relocating for work…"
              className="resize-none h-24"
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Submitting…' : 'Submit Notice'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
