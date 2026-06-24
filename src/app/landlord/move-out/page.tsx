import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MoveOutActions } from './move-out-actions'
import { format } from 'date-fns'
import { demoMoveOutNotices } from '@/lib/demo-data'

export default async function LandlordMoveOutPage() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    const notices = demoMoveOutNotices
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Move-out Notices</h1>
          <p className="text-sm text-slate-500 mt-1">Tenant intent to vacate</p>
        </div>
        <div className="rounded-xl border bg-white divide-y shadow-sm">
          {notices.map(n => {
            const profile = n.profiles as { full_name: string; units: { label: string } | null } | null
            return (
              <div key={n.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-slate-900">{profile?.full_name}</p>
                      <span className="text-xs text-slate-400">{profile?.units?.label}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">Moving out: <strong>{format(new Date(n.intended_move_out_date), 'MMMM d, yyyy')}</strong></p>
                    {n.reason && <p className="text-xs text-slate-500 mt-1">Reason: {n.reason}</p>}
                    <p className="text-xs text-slate-400 mt-1">Submitted {format(new Date(n.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  <MoveOutActions notice={n as any} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notices } = await supabase
    .from('move_out_notices')
    .select(`
      *,
      profiles!move_out_notices_tenant_id_fkey(full_name, unit_id, units(label))
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Move-out Notices</h1>
        <p className="text-sm text-slate-500 mt-1">Tenant intent to vacate</p>
      </div>

      {!notices || notices.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p>No move-out notices received</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white divide-y shadow-sm">
          {notices.map(n => {
            const profile = n.profiles as { full_name: string; units: { label: string } | null } | null
            return (
              <div key={n.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-slate-900">{profile?.full_name}</p>
                      <span className="text-xs text-slate-400">{profile?.units?.label}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      Moving out: <strong>{format(new Date(n.intended_move_out_date), 'MMMM d, yyyy')}</strong>
                    </p>
                    {n.reason && (
                      <p className="text-xs text-slate-500 mt-1">Reason: {n.reason}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      Submitted {format(new Date(n.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <MoveOutActions notice={n} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
