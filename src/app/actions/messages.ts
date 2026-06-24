'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendMessage(recipientId: string | null, body: string) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return { success: true }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!body.trim()) return { error: 'Message cannot be empty' }

  const { error } = await supabase.from('messages').insert({
    sender_id: user.id,
    recipient_id: recipientId,
    body: body.trim(),
  })

  if (error) return { error: error.message }

  // Notify recipient
  const { data: sender } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (recipientId) {
    await supabase.from('notifications').insert({
      user_id: recipientId,
      type: 'new_message',
      title: 'New message',
      body: `${sender?.full_name ?? 'Someone'} sent you a message.`,
      link: sender?.role === 'landlord' ? '/tenant/messages' : '/landlord/messages',
    })
  } else {
    // Broadcast — notify all tenants
    const { data: tenants } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'tenant')

    if (tenants) {
      await supabase.from('notifications').insert(
        tenants.map(t => ({
          user_id: t.id,
          type: 'broadcast',
          title: 'Announcement',
          body: `${sender?.full_name ?? 'Landlord'}: ${body.slice(0, 80)}${body.length > 80 ? '…' : ''}`,
          link: '/tenant/messages',
        }))
      )
    }
  }

  revalidatePath('/landlord/messages')
  revalidatePath('/tenant/messages')
  return { success: true }
}

export async function markMessagesRead(otherUserId: string) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', otherUserId)
    .eq('recipient_id', user.id)
    .is('read_at', null)
}
