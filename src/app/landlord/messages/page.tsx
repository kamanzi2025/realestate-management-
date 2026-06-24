import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LandlordMessaging } from './landlord-messaging'
import { demoTenants, demoMessages, DEMO_LANDLORD_ID } from '@/lib/demo-data'

export default async function LandlordMessagesPage() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-sm text-slate-500 mt-1">Per-tenant threads and broadcast</p>
        </div>
        <LandlordMessaging tenants={demoTenants as any} messages={demoMessages as any} landlordId={DEMO_LANDLORD_ID} />
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenants } = await supabase
    .from('profiles')
    .select('id, full_name, unit_id, units(label)')
    .eq('role', 'tenant')
    .order('full_name')

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="text-sm text-slate-500 mt-1">Per-tenant threads and broadcast</p>
      </div>
      <LandlordMessaging
        tenants={tenants ?? []}
        messages={messages ?? []}
        landlordId={user.id}
      />
    </div>
  )
}
