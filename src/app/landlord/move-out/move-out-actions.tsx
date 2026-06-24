'use client'

import { useState } from 'react'
import { acknowledgeMoveOut } from '@/app/actions/move-out'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'

interface Notice {
  id: string
  status: string
}

export function MoveOutActions({ notice }: { notice: Notice }) {
  const [loading, setLoading] = useState(false)

  if (notice.status === 'acknowledged') {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
        <CheckCircle2 className="h-3 w-3" />
        Acknowledged
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
        Pending
      </span>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        disabled={loading}
        onClick={async () => {
          setLoading(true)
          const result = await acknowledgeMoveOut(notice.id)
          setLoading(false)
          if (result?.error) toast.error(result.error)
          else toast.success('Notice acknowledged')
        }}
      >
        Acknowledge
      </Button>
    </div>
  )
}
