'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddExpenseDialog } from './add-expense-dialog'
import { ExpensesList } from './expenses-list'
import { IncomeExpenseChart } from './income-expense-chart'
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from 'date-fns'
import { TrendingUp, TrendingDown, DollarSign, Minus, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import type { ExpenseWithUnit } from './page'

interface Unit { id: string; label: string; monthly_rent: number; status: string }
interface Lease { id: string; unit_id: string; tenant_id: string; monthly_rent: number }
interface Payment { id: string; tenant_id: string; period_month: string; amount: number; status: string; lease_id: string }
interface MaintenanceRequest { id: string; unit_id: string; category: string; description: string; created_at: string }

interface Props {
  units: Unit[]
  activeLeases: Lease[]
  allPayments: Payment[]
  allExpenses: ExpenseWithUnit[]
  maintenanceRequests: MaintenanceRequest[]
  currentMonthStart: string
  currentMonthEnd: string
  yearStart: string
  chartStart: string
  currentMonth: string
}

export function FinancialDashboard({
  units, activeLeases, allPayments, allExpenses, maintenanceRequests,
  currentMonthStart, currentMonthEnd, yearStart, chartStart, currentMonth,
}: Props) {
  const [chartRange, setChartRange] = useState<6 | 12>(6)
  const [dateFrom, setDateFrom] = useState(currentMonthStart)
  const [dateTo, setDateTo] = useState(currentMonthEnd)

  // ── Filtered data for the custom date range ──────────────────────────────
  const rangePayments = useMemo(() => allPayments.filter(p => {
    const [y, m] = p.period_month.split('-').map(Number)
    const periodDate = new Date(y, m - 1, 1)
    return periodDate >= new Date(dateFrom) && periodDate <= new Date(dateTo)
  }), [allPayments, dateFrom, dateTo])

  const rangeExpenses = useMemo(() => allExpenses.filter(e =>
    e.expense_date >= dateFrom && e.expense_date <= dateTo
  ), [allExpenses, dateFrom, dateTo])

  const rangeCollected = rangePayments
    .filter(p => p.status === 'confirmed')
    .reduce((s, p) => s + p.amount, 0)

  const rangeExpenseTotal = rangeExpenses.reduce((s, e) => s + e.amount, 0)

  // Expected is sum of active lease rents × number of months in range
  // (approximate: count distinct period_months in range × total monthly_rent)
  const monthsInRange = useMemo(() => {
    const from = startOfMonth(new Date(dateFrom))
    const to = endOfMonth(new Date(dateTo))
    return eachMonthOfInterval({ start: from, end: to }).length
  }, [dateFrom, dateTo])
  const rangeExpected = activeLeases.reduce((s, l) => s + l.monthly_rent, 0) * monthsInRange

  // ── YTD summary ──────────────────────────────────────────────────────────
  const ytdPayments = allPayments.filter(p => p.period_month >= yearStart.slice(0, 7))
  const ytdExpenses = allExpenses.filter(e => e.expense_date >= yearStart)
  const ytdCollected = ytdPayments.filter(p => p.status === 'confirmed').reduce((s, p) => s + p.amount, 0)
  const ytdExpenseTotal = ytdExpenses.reduce((s, e) => s + e.amount, 0)

  // ── Per-unit breakdown ───────────────────────────────────────────────────
  const leaseByTenantId = new Map(activeLeases.map(l => [l.tenant_id, l]))
  const leaseByUnitId   = new Map(activeLeases.map(l => [l.unit_id, l]))
  const yearStr = yearStart.slice(0, 7) // "YYYY-MM"

  const unitRows = units.map(unit => {
    const lease = leaseByUnitId.get(unit.id)
    const ytdPaid = allPayments
      .filter(p => p.lease_id === lease?.id && p.period_month >= yearStr && p.status === 'confirmed')
      .reduce((s, p) => s + p.amount, 0)
    const ytdExpUnit = allExpenses
      .filter(e => e.unit_id === unit.id && e.expense_date >= yearStart)
      .reduce((s, e) => s + e.amount, 0)
    const thisMonthPayment = allPayments.find(
      p => p.lease_id === lease?.id && p.period_month === currentMonth
    )
    return { unit, lease, ytdPaid, ytdExpUnit, thisMonthPayment }
  })

  // ── Chart data ───────────────────────────────────────────────────────────
  const chartMonths = useMemo(() => {
    const n = chartRange
    const months: { label: string; month: string }[] = []
    for (let i = n - 1; i >= 0; i--) {
      const d = subMonths(new Date(), i)
      months.push({ label: format(d, 'MMM yy'), month: format(d, 'yyyy-MM') })
    }
    return months
  }, [chartRange])

  const chartData = useMemo(() => chartMonths.map(({ label, month }) => {
    const income = allPayments
      .filter(p => p.period_month === month && p.status === 'confirmed')
      .reduce((s, p) => s + p.amount, 0)
    const expense = allExpenses
      .filter(e => e.expense_date.startsWith(month))
      .reduce((s, e) => s + e.amount, 0)
    return { label, income, expense, net: income - expense }
  }), [chartMonths, allPayments, allExpenses])

  const paymentStatus = (thisMonthPayment: Payment | undefined, hasLease: boolean) => {
    if (!hasLease) return { label: 'Vacant', icon: <Minus className="h-3 w-3" />, cls: 'bg-slate-100 text-slate-500' }
    if (thisMonthPayment?.status === 'confirmed') return { label: 'Paid', icon: <CheckCircle2 className="h-3 w-3" />, cls: 'bg-green-100 text-green-700' }
    if (thisMonthPayment?.status === 'pending_review') return { label: 'Pending', icon: <Clock className="h-3 w-3" />, cls: 'bg-amber-100 text-amber-700' }
    return { label: 'Unpaid', icon: <AlertCircle className="h-3 w-3" />, cls: 'bg-red-100 text-red-700' }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financials</h1>
          <p className="text-sm text-slate-500 mt-1">Income, expenses, and net cash flow</p>
        </div>
        <AddExpenseDialog units={units} maintenanceRequests={maintenanceRequests} />
      </div>

      {/* ── Date range filter ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-3 shadow-sm">
        <span className="text-sm font-medium text-slate-600 shrink-0">Date range:</span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="text-sm border rounded-lg px-2 py-1.5 text-slate-700"
          />
          <span className="text-slate-400 text-sm">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="text-sm border rounded-lg px-2 py-1.5 text-slate-700"
          />
        </div>
        <div className="flex gap-1.5">
          {(['This Month', 'Last Month', 'This Year'] as const).map(label => (
            <button
              key={label}
              onClick={() => {
                const now = new Date()
                if (label === 'This Month') {
                  setDateFrom(format(startOfMonth(now), 'yyyy-MM-dd'))
                  setDateTo(format(endOfMonth(now), 'yyyy-MM-dd'))
                } else if (label === 'Last Month') {
                  const last = subMonths(now, 1)
                  setDateFrom(format(startOfMonth(last), 'yyyy-MM-dd'))
                  setDateTo(format(endOfMonth(last), 'yyyy-MM-dd'))
                } else {
                  setDateFrom(format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'))
                  setDateTo(format(endOfMonth(now), 'yyyy-MM-dd'))
                }
              }}
              className="text-xs px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary cards (range) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Collected" value={rangeCollected} icon={<TrendingUp className="h-4 w-4 text-green-500" />} cls="text-green-700" />
        <SummaryCard label="Expected" value={rangeExpected} icon={<DollarSign className="h-4 w-4 text-slate-400" />} cls="text-slate-700" />
        <SummaryCard label="Expenses" value={rangeExpenseTotal} icon={<TrendingDown className="h-4 w-4 text-red-400" />} cls="text-red-600" />
        <SummaryCard
          label="Net"
          value={rangeCollected - rangeExpenseTotal}
          icon={<DollarSign className="h-4 w-4 text-blue-500" />}
          cls={rangeCollected - rangeExpenseTotal >= 0 ? 'text-blue-700' : 'text-red-700'}
        />
      </div>

      {/* ── YTD summary ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Year-to-Date ({new Date().getFullYear()})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-slate-400">Collected</p>
              <p className="text-xl font-bold text-green-600">${ytdCollected.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Expenses</p>
              <p className="text-xl font-bold text-red-500">${ytdExpenseTotal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Net</p>
              <p className={`text-xl font-bold ${ytdCollected - ytdExpenseTotal >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                ${(ytdCollected - ytdExpenseTotal).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Chart ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Income vs Expenses</CardTitle>
          <div className="flex gap-1">
            {([6, 12] as const).map(n => (
              <button
                key={n}
                onClick={() => setChartRange(n)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${chartRange === n ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {n}M
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <IncomeExpenseChart data={chartData} />
        </CardContent>
      </Card>

      {/* ── Per-unit breakdown ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Per-Unit Breakdown ({new Date().getFullYear()} YTD)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Unit</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Rent/mo</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">This month</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">YTD collected</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">YTD expenses</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">YTD net</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {unitRows.map(({ unit, lease, ytdPaid, ytdExpUnit, thisMonthPayment }) => {
                  const st = paymentStatus(thisMonthPayment, !!lease)
                  return (
                    <tr key={unit.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{unit.label}</td>
                      <td className="px-4 py-3 text-right text-slate-600">${unit.monthly_rent.toFixed(0)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>
                            {st.icon}{st.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-green-700 font-medium">${ytdPaid.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-red-500">${ytdExpUnit.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${ytdPaid - ytdExpUnit >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                        ${(ytdPaid - ytdExpUnit).toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
                {/* Building-wide expenses row */}
                {(() => {
                  const bldgExp = allExpenses.filter(e => !e.unit_id && e.expense_date >= yearStart)
                    .reduce((s, e) => s + e.amount, 0)
                  return bldgExp > 0 ? (
                    <tr className="bg-slate-50 font-medium">
                      <td className="px-4 py-3 text-slate-600" colSpan={4}>Building-wide expenses</td>
                      <td className="px-4 py-3 text-right text-red-500">${bldgExp.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-red-600">-${bldgExp.toFixed(2)}</td>
                    </tr>
                  ) : null
                })()}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Expenses list ── */}
      <ExpensesList expenses={rangeExpenses} units={units} />
    </div>
  )
}

function SummaryCard({ label, value, icon, cls }: { label: string; value: number; icon: React.ReactNode; cls: string }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-1.5 mb-1">
          {icon}
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        </div>
        <p className={`text-xl font-bold ${cls}`}>${Math.abs(value).toFixed(2)}</p>
      </CardContent>
    </Card>
  )
}
