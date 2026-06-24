import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NotificationList } from '@/components/notification-list'
import { markAllNotificationsRead } from '@/app/actions/notifications'
import { demoNotifications } from '@/lib/demo-data'

export default async function LandlordNotificationsPage() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    const notifications = demoNotifications
    const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id)
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            {unreadIds.length > 0 && <p className="text-sm text-slate-500 mt-1">{unreadIds.length} unread</p>}
          </div>
        </div>
        <NotificationList notifications={notifications as any} />
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const unreadIds = notifications?.filter(n => !n.read_at).map(n => n.id) ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          {unreadIds.length > 0 && (
            <p className="text-sm text-slate-500 mt-1">{unreadIds.length} unread</p>
          )}
        </div>
        {unreadIds.length > 0 && (
          <form action={markAllNotificationsRead}>
            <button type="submit" className="text-sm text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline">
              Mark all read
            </button>
          </form>
        )}
      </div>
      <NotificationList notifications={notifications ?? []} />
    </div>
  )
}
