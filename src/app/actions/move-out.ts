'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitMoveOutNotice(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: lease } = await supabase
    .from('leases')
    .select('id')
    .eq('tenant_id', user.id)
    .eq('status', 'active')
    .single()

  if (!lease) return { error: 'No active lease found' }

  const { error } = await supabase.from('move_out_notices').insert({
    lease_id: lease.id,
    tenant_id: user.id,
    intended_move_out_date: formData.get('move_out_date') as string,
    reason: (formData.get('reason') as string) || null,
    status: 'submitted',
  })

  if (error) return { error: error.message }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, units(label)')
    .eq('id', user.id)
    .single()

  const { data: landlord } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'landlord')
    .single()

  if (landlord) {
    const unitLabel = (profile?.units as { label: string } | null)?.label ?? 'a unit'
    await supabase.from('notifications').insert({
      user_id: landlord.id,
      type: 'move_out_notice',
      title: 'Move-out notice received',
      body: `${profile?.full_name ?? 'A tenant'} (${unitLabel}) submitted a move-out notice.`,
      link: '/landlord/move-out',
    })
  }

  revalidatePath('/tenant/move-out')
  return { success: true }
}

export async function acknowledgeMoveOut(noticeId: string) {
  const supabase = await createClient()
  const { data: notice, error } = await supabase
    .from('move_out_notices')
    .update({ status: 'acknowledged' })
    .eq('id', noticeId)
    .select('tenant_id, intended_move_out_date')
    .single()

  if (error) return { error: error.message }

  await supabase.from('notifications').insert({
    user_id: notice.tenant_id,
    type: 'move_out_acknowledged',
    title: 'Move-out notice acknowledged',
    body: `Your move-out notice for ${notice.intended_move_out_date} has been acknowledged.`,
    link: '/tenant/move-out',
  })

  revalidatePath('/landlord/move-out')
  return { success: true }
}
