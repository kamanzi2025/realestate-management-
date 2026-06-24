'use client'

import { useState } from 'react'
import { MessageThread } from '@/components/message-thread'
import { Megaphone, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Tenant {
  id: string
  full_name: string
  unit_id: string | null
  units: { label: string } | null
}

interface Message {
  id: string
  sender_id: string
  recipient_id: string | null
  body: string
  created_at: string
  read_at: string | null
}

interface Props {
  tenants: Tenant[]
  messages: Message[]
  landlordId: string
}

export function LandlordMessaging({ tenants, messages, landlordId }: Props) {
  const [selectedId, setSelectedId] = useState<string | 'broadcast'>('broadcast')

  const threadMessages = selectedId === 'broadcast'
    ? messages.filter(m => m.recipient_id === null)
    : messages.filter(m =>
        (m.sender_id === landlordId && m.recipient_id === selectedId) ||
        (m.sender_id === selectedId && m.recipient_id === landlordId)
      )

  const selectedTenant = tenants.find(t => t.id === selectedId)

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[500px]">
      {/* Thread list */}
      <div className="w-52 shrink-0 rounded-xl border bg-white shadow-sm overflow-auto">
        <button
          onClick={() => setSelectedId('broadcast')}
          className={cn(
            'w-full text-left px-3 py-2.5 flex items-center gap-2.5 border-b transition-colors text-sm',
            selectedId === 'broadcast' ? 'bg-slate-100' : 'hover:bg-slate-50'
          )}
        >
          <Megaphone className="h-4 w-4 text-slate-500 shrink-0" />
          <span className="font-medium text-slate-800 truncate">Broadcast</span>
        </button>
        {tenants.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedId(t.id)}
            className={cn(
              'w-full text-left px-3 py-2.5 flex items-center gap-2.5 border-b last:border-b-0 transition-colors',
              selectedId === t.id ? 'bg-slate-100' : 'hover:bg-slate-50'
            )}
          >
            <User className="h-4 w-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{t.full_name}</p>
              <p className="text-xs text-slate-400 truncate">{t.units?.label ?? 'No unit'}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Active thread */}
      <div className="flex-1 min-w-0">
        <MessageThread
          messages={threadMessages}
          currentUserId={landlordId}
          recipientId={selectedId === 'broadcast' ? null : selectedId}
          recipientName={selectedTenant?.full_name ?? ''}
          currentUserName="Landlord"
          isBroadcastThread={selectedId === 'broadcast'}
        />
      </div>
    </div>
  )
}
