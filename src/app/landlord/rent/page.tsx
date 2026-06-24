import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RentReviewList } from './rent-review-list'
import { RentSummary, type UnitRentStatus, type PaymentSlim } from './rent-summary'
import { currentPeriodMonth, formatPeriodMonth } from '@/lib/rent-utils'
import { demoPayments, demoUnits, demoActiveLeases } from '@/lib/demo-data'

export default async function LandlordRentPage() {
  const period = currentPeriodMonth()

  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    const paymentMap = new Map(
      demoPayments.filter(p => p.period_month === period).map(p => [p.tenant_id, p])
    )

    const unitStatuses: UnitRentStatus[] = demoUnits.map(unit => {
      const leaseRef = demoActiveLeases.find(l => l.unit_id === unit.id)
      const tenant = (unit.profiles as { id: string; full_name: string }[])[0]
      const payment = leaseRef?.tenant_id ? paymentMap.get(leaseRef.tenant_id) : undefined
      return {
        id: unit.id,
        label: unit.label,
        tenantName: tenant?.full_name ?? null,
        paymentStatus: payment?.status ?? (leaseRef ? 'unpaid' : null),
        paymentAmount: (payment as any)?.amount ?? null,
        monthlyRent: leaseRef?.monthly_rent ?? unit.monthly_rent,
      }
    })

    const monthlyExpected = demoActiveLeases.reduce((s, l) => s + l.monthly_rent, 0)
    const allPayments: PaymentSlim[] = demoPayments.map(p => ({
      period_month: p.period_month,
      amount: p.amount,
      status: p.status,
    }))

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rent</h1>
          <p className="text-sm text-slate-500 mt-1">{formatPeriodMonth(period)}</p>
        </div>
        <RentSummary
          units={unitStatuses}
          monthlyExpected={monthlyExpected}
          allPayments={allPayments}
          currentPeriod={period}
        />
        <RentReviewList payments={demoPayments as any} currentPeriod={period} />
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // All units with tenant + active lease for the unit grid
  const { data: allUnits } = await supabase
    .from('units')
    .select(`
      id, label, status, monthly_rent,
      profiles!profiles_unit_id_fkey(id, full_name),
      leases!leases_unit_id_fkey(id, status, monthly_rent, tenant_id)
    `)
    .order('label')

  // Current month payments (for unit grid status)
  const { data: currentPayments } = await supabase
    .from('payments')
    .select('tenant_id, amount, status, period_month')
    .eq('period_month', period)

  // All payments (last 12 months, for quarterly/yearly totals)
  const { data: allPaymentsRaw } = await supabase
    .from('payments')
    .select('period_month, amount, status')
    .order('period_month', { ascending: false })
    .limit(300)

  // Full payment details for the review list
  const { data: payments } = await supabase
    .from('payments')
    .select(`*, profiles!payments_tenant_id_fkey(full_name, unit_id, units(label))`)
    .order('submitted_at', { ascending: false })

  const currentPaymentMap = new Map(
    (currentPayments ?? []).map(p => [p.tenant_id, p])
  )

  const unitStatuses: UnitRentStatus[] = (allUnits ?? []).map(unit => {
    const activeLease = (unit.leases as { id: string; status: string; monthly_rent: number; tenant_id: string }[] | null)
      ?.find(l => l.status === 'active')
    const tenant = (unit.profiles as { id: string; full_name: string }[] | null)?.[0]
    const payment = activeLease?.tenant_id ? currentPaymentMap.get(activeLease.tenant_id) : undefined
    return {
      id: unit.id,
      label: unit.label,
      tenantName: tenant?.full_name ?? null,
      paymentStatus: payment?.status ?? (activeLease ? 'unpaid' : null),
      paymentAmount: payment?.amount ?? null,
      monthlyRent: activeLease?.monthly_rent ?? unit.monthly_rent,
    }
  })

  const monthlyExpected = (allUnits ?? []).reduce((sum, unit) => {
    const activeLease = (unit.leases as { status: string; monthly_rent: number }[] | null)
      ?.find(l => l.status === 'active')
    return sum + (activeLease?.monthly_rent ?? 0)
  }, 0)

  const allPayments: PaymentSlim[] = (allPaymentsRaw ?? []).map(p => ({
    period_month: p.period_month,
    amount: p.amount,
    status: p.status,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rent</h1>
        <p className="text-sm text-slate-500 mt-1">{formatPeriodMonth(period)}</p>
      </div>

      <RentSummary
        units={unitStatuses}
        monthlyExpected={monthlyExpected}
        allPayments={allPayments}
        currentPeriod={period}
      />

      <RentReviewList payments={payments ?? []} currentPeriod={period} />
    </div>
  )
}
