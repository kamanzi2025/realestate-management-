import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format, differenceInDays } from 'date-fns'
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NewTenantDialog } from './new-tenant-dialog'

interface LeaseRow {
  id: string
  status: string
  monthly_rent: number
  deposit_amount: number
  move_in_date: string
  rent_due_day: number
  lease_start: string
  lease_end: string | null
  profiles: { full_name: string; phone: string | null } | null
  units: { label: string; bedroom_count: number } | null
}

export default async function LandlordLeasesPage() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    const { demoLeases, demoAllUnits } = await import('@/lib/demo-data')
    const activeLeases = demoLeases.filter(l => l.status === 'active') as unknown as LeaseRow[]
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Leases</h1>
            <p className="text-sm text-slate-500 mt-1">Active and historical lease records</p>
          </div>
          <NewTenantDialog units={demoAllUnits} />
        </div>
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-slate-800">Active Leases</h2>
          {activeLeases.map(l => {
            const leaseEnd = l.lease_end ? new Date(l.lease_end) : null
            const daysLeft = leaseEnd ? differenceInDays(leaseEnd, new Date()) : null
            const expiringSoon = daysLeft !== null && daysLeft <= 60 && daysLeft > 0
            return (
              <Card key={l.id} className={`shadow-sm ${expiringSoon ? 'border-amber-300' : ''}`}>
                {expiringSoon && (
                  <div className="flex items-center gap-2 px-4 pt-3 pb-0 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs font-medium">Expires in {daysLeft} days — renewal needed</span>
                  </div>
                )}
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{l.units?.label}</p>
                        <Badge variant="secondary" className="text-xs">{l.units?.bedroom_count}BR</Badge>
                      </div>
                      <p className="text-sm text-slate-700 mt-0.5">{l.profiles?.full_name}</p>
                      {l.profiles?.phone && <p className="text-xs text-slate-400">{l.profiles.phone}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">${l.monthly_rent.toFixed(2)}/mo</p>
                      <p className="text-xs text-slate-400">Deposit: ${l.deposit_amount.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                    <div><span className="text-slate-400">Move-in: </span>{format(new Date(l.move_in_date), 'MMM d, yyyy')}</div>
                    <div><span className="text-slate-400">Rent due: </span>Day {l.rent_due_day}</div>
                    <div><span className="text-slate-400">Lease end: </span>{leaseEnd ? format(leaseEnd, 'MMM d, yyyy') : 'Month-to-month'}</div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawLeases } = await supabase
    .from('leases')
    .select(`
      id, status, monthly_rent, deposit_amount, move_in_date,
      rent_due_day, lease_start, lease_end,
      profiles!leases_tenant_id_fkey(full_name, phone),
      units!leases_unit_id_fkey(label, bedroom_count)
    `)
    .order('created_at', { ascending: false })

  const leases = (rawLeases ?? []) as unknown as LeaseRow[]

  const { data: allUnits } = await supabase
    .from('units')
    .select('id, label, monthly_rent, status')
    .order('label')

  const activeLeases = leases.filter(l => l.status === 'active')
  const endedLeases = leases.filter(l => l.status === 'ended')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leases</h1>
          <p className="text-sm text-slate-500 mt-1">Active and historical lease records</p>
        </div>
        <NewTenantDialog units={allUnits ?? []} />
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">Active Leases</h2>
        {activeLeases.length === 0 && (
          <p className="text-slate-400 text-sm">No active leases.</p>
        )}
        {activeLeases.map(l => {
          const leaseEnd = l.lease_end ? new Date(l.lease_end) : null
          const daysLeft = leaseEnd ? differenceInDays(leaseEnd, new Date()) : null
          const expiringSoon = daysLeft !== null && daysLeft <= 60 && daysLeft > 0

          return (
            <Card key={l.id} className={`shadow-sm ${expiringSoon ? 'border-amber-300' : ''}`}>
              {expiringSoon && (
                <div className="flex items-center gap-2 px-4 pt-3 pb-0 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-medium">Expires in {daysLeft} days — renewal needed</span>
                </div>
              )}
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{l.units?.label}</p>
                      <Badge variant="secondary" className="text-xs">{l.units?.bedroom_count}BR</Badge>
                    </div>
                    <p className="text-sm text-slate-700 mt-0.5">{l.profiles?.full_name}</p>
                    {l.profiles?.phone && (
                      <p className="text-xs text-slate-400">{l.profiles.phone}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">${l.monthly_rent.toFixed(2)}/mo</p>
                    <p className="text-xs text-slate-400">Deposit: ${l.deposit_amount.toFixed(2)}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400">Move-in: </span>
                    {format(new Date(l.move_in_date), 'MMM d, yyyy')}
                  </div>
                  <div>
                    <span className="text-slate-400">Rent due: </span>
                    Day {l.rent_due_day}
                  </div>
                  <div>
                    <span className="text-slate-400">Lease end: </span>
                    {leaseEnd ? format(leaseEnd, 'MMM d, yyyy') : 'Month-to-month'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {endedLeases.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-slate-800">Past Leases</h2>
          <div className="rounded-xl border bg-white divide-y shadow-sm">
            {endedLeases.map(l => (
              <div key={l.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {l.units?.label} · {l.profiles?.full_name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {format(new Date(l.lease_start), 'MMM yyyy')} –{' '}
                    {l.lease_end ? format(new Date(l.lease_end), 'MMM yyyy') : 'N/A'}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">Ended</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
