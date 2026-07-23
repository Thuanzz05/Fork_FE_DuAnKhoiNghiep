import { api, apiRequest } from './api'

export type NotificationItem = {
  id: string
  type: string
  title: string
  content: string
  path: string | null
  read: boolean
  readAt: string | null
  createdAt: string
}

export type NotificationList = {
  items: NotificationItem[]
  unread: number
}

const vapidPublicKey = String(import.meta.env.VITE_VAPID_PUBLIC_KEY || '').trim()

const urlBase64ToUint8Array = (value: string) => {
  const padding = '='.repeat((4 - value.length % 4) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)))
}

export const supportsWebPush = () => (
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
)

export const getPushPermission = (): NotificationPermission | 'unsupported' => {
  if (!supportsWebPush()) return 'unsupported'
  return Notification.permission
}

const registerWorker = () => navigator.serviceWorker.register('/sw.js', { scope: '/' })

const saveSubscription = async (subscription: PushSubscription) => {
  const json = subscription.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Trình duyệt không trả về khóa đăng ký thông báo hợp lệ.')
  }
  await api.post('/push/subscribe', {
    endpoint: json.endpoint,
    keys: json.keys,
    userAgent: navigator.userAgent,
  })
}

export async function syncPushSubscription(requestPermission = false) {
  if (!supportsWebPush()) throw new Error('Trình duyệt này chưa hỗ trợ thông báo đẩy.')
  if (!vapidPublicKey) throw new Error('Frontend chưa cấu hình VITE_VAPID_PUBLIC_KEY.')

  let permission = Notification.permission
  if (requestPermission && permission === 'default') permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    if (permission === 'denied') throw new Error('Thông báo đang bị chặn trong cài đặt trình duyệt.')
    return { subscribed: false, permission }
  }

  const registration = await registerWorker()
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })
  }
  await saveSubscription(subscription)
  return { subscribed: true, permission }
}

export async function disablePushNotifications() {
  if (!supportsWebPush()) return
  const registration = await navigator.serviceWorker.getRegistration('/')
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return
  try {
    await apiRequest('/push/subscribe', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    })
  } finally {
    await subscription.unsubscribe()
  }
}

export const getNotifications = () => api.get<NotificationList>('/notifications?limit=30')
export const markNotificationRead = (id: string) => api.patch(`/notifications/${id}/read`)
export const markAllNotificationsRead = () => api.patch('/notifications/read-all')
