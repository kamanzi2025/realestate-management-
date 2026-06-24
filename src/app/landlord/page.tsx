import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { currentPeriodMonth } from '@/lib/rent-utils'
import { CheckCircle2, Clock, AlertCircle, Wrench, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { demoUnits, demoCurrentPayments, demoMaintenanceRequests } from '@/lib/demo-data'

export default async function LandlordOverviewPage() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    const period = currentPeriodMonth()
    const paymentMap = new Map(demoCurrentPayments.map(p => [p.tenant_id, p.status]))
    const maintenanceCountMap = new Map<string, number>()
    for (const m of demoMaintenanceRequests.filter(r => r.status !== 'resolved')) {
      maintenanceCountMap.set(m.unit_id, (maintenanceCountMap.get(m.unit_id) ?? 0) + 1)
    }
    const confirmedCount = demoCurrentPayments.filter(p => p.status === 'confirmed').length
    const pendingCount   = demoCurrentPayments.filter(p => p.status === 'pending_review').length
    const units = demoUnits
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
          <p className="text-sm text-slate-500 mt-1">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card className="shadow-sm"><CardContent className="pt-4"><p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Confirmed</p><p className="text-2xl font-bold text-green-600 mt-1">{confirmedCount}<span className="text-sm font-normal text-slate-400"> / {units.length}</span></p></CardContent></Card>
          <Card className="shadow-sm"><CardContent className="pt-4"><p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Pending</p><p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p></CardContent></Card>
          <Card className="shadow-sm col-span-2 sm:col-span-1"><CardContent className="pt-4"><p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Open Issues</p><p className="text-2xl font-bold text-red-600 mt-1">{demoMaintenanceRequests.filter(r => r.status !== 'resolved').length}</p></CardContent></Card>
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-800 mb-3">Units</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {units.map(unit => {
              const activeLease = (unit.leases as { id: string; status: string; monthly_rent: number; tenant_id: string }[]).find(l => l.status === 'active')
              const tenant = (unit.profiles as { id: string; full_name: string }[])[0]
              const payStatus = activeLease?.tenant_id ? paymentMap.get(activeLease.tenant_id) : undefined
              const openMaint = maintenanceCountMap.get(unit.id) ?? 0
              return (
                <Link key={unit.id} href={`/landlord/units/${unit.id}`} className="block">
                  <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{unit.label}</p>
                          <p className="text-xs text-slate-500">{unit.bedroom_count}BR · ${unit.monthly_rent.toFixed(0)}/mo</p>
                        </div>
                        <RentStatusBadge status={payStatus} isOccupied={unit.status === 'occupied'} />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Users className="h-3.5 w-3.5" />
                          <span className="text-xs">{tenant?.full_name ?? 'Vacant'}</span>
                        </div>
                        {openMaint > 0 && (
                          <div className="flex items-center gap-1 text-xs text-orange-600">
                            <Wrench className="h-3.5 w-3.5" />{openMaint} open
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
        <div className="text-center pt-2">
          <Link href="/landlord/rent" className="text-sm text-slate-600 hover:text-slate-800 underline-offset-2 hover:underline">View rent details →</Link>
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const period = currentPeriodMonth()

  const { data: units } = await supabase
    .from('units')
    .select(`
      *,
      profiles!profiles_unit_id_fkey(id, full_name),
      leases!leases_unit_id_fkey(id, status, monthly_rent, tenant_id)
    `)
    .order('label')

  const { data: payments } = await supabase
    .from('payments')
    .select('tenant_id, status, period_month')
    .eq('period_month', period)

  const { data: maintenanceAll } = await supabase
    .from('maintenance_requests')
    .select('unit_id, status')
    .neq('status', 'resolved')

  const paymentMap = new Map(payments?.map(p => [p.tenant_id, p.status]) ?? [])
  const maintenanceCountMap = new Map<string, number>()
  for (const m of maintenanceAll ?? []) {
    maintenanceCountMap.set(m.unit_id, (maintenanceCountMap.get(m.unit_id) ?? 0) + 1)
  }

  const totalExpected = units?.reduce((sum, u) => {
    const activeLease = (u.leases as { status: string; monthly_rent: number }[] | null)
      ?.find(l => l.status === 'active')
    return sum + (activeLease?.monthly_rent ?? 0)
  }, 0) ?? 0

  const totalConfirmed = payments
    ?.filter(p => p.status === 'confirmed')
    .reduce((sum, p) => sum + 0, 0) ?? 0

  const confirmedCount = payments?.filter(p => p.status === 'confirmed').length ?? 0
  const pendingCount = payments?.filter(p => p.status === 'pending_review').length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="shadow-sm">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Confirmed</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{confirmedCount}<span className="text-sm font-normal text-slate-400"> / {units?.length ?? 4}</span></p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm col-span-2 sm:col-span-1">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Open Issues</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{maintenanceAll?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Units grid */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-3">Units</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {units?.map(unit => {
            const activeLease = (unit.leases as { id: string; status: string; monthly_rent: number; tenant_id: string }[] | null)
              ?.find(l => l.status === 'active')
            const tenant = (unit.profiles as { id: string; full_name: string }[] | null)?.[0]
            const payStatus = activeLease?.tenant_id ? paymentMap.get(activeLease.tenant_id) : undefined
            const openMaint = maintenanceCountMap.get(unit.id) ?? 0

            return (
              <Link key={unit.id} href={`/landlord/units/${unit.id}`} className="block">
                <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{unit.label}</p>
                        <p className="text-xs text-slate-500">{unit.bedroom_count}BR · ${unit.monthly_rent.toFixed(0)}/mo</p>
                      </div>
                      <RentStatusBadge status={payStatus} isOccupied={unit.status === 'occupied'} />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-xs">{tenant?.full_name ?? 'Vacant'}</span>
                      </div>
                      {openMaint > 0 && (
                        <div className="flex items-center gap-1 text-xs text-orange-600">
                          <Wrench className="h-3.5 w-3.5" />
                          {openMaint} open
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="text-center pt-2">
        <Link href="/landlord/rent" className="text-sm text-slate-600 hover:text-slate-800 underline-offset-2 hover:underline">
          View rent details →
        </Link>
      </div>
    </div>
  )
}

function RentStatusBadge({ status, isOccupied }: { status?: string; isOccupied: boolean }) {
  if (!isOccupied) return <Badge variant="secondary" className="text-xs">Vacant</Badge>
  if (status === 'confirmed') return <Badge className="bg-green-100 text-green-800 text-xs border-0"><CheckCircle2 className="h-3 w-3 mr-1" />Paid</Badge>
  if (status === 'pending_review') return <Badge className="bg-amber-100 text-amber-800 text-xs border-0"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
  return <Badge className="bg-red-100 text-red-800 text-xs border-0"><AlertCircle className="h-3 w-3 mr-1" />Unpaid</Badge>
}
