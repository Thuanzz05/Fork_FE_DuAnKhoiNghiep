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

export type PushPermissionState = NotificationPermission
  | 'insecure-context'
  | 'ios-install-required'
  | 'embedded-browser'
  | 'unsupported'

const urlBase64ToUint8Array = (value: string) => {
  const padding = '='.repeat((4 - value.length % 4) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)))
}

const isIOSDevice = () => {
  const platform = navigator.platform || ''
  return /iPad|iPhone|iPod/i.test(navigator.userAgent)
    || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

const isStandaloneApp = () => (
  window.matchMedia('(display-mode: standalone)').matches
  || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
)

const isEmbeddedBrowser = () => (
  /FBAN|FBAV|Instagram|Zalo|Line\/|\bwv\b/i.test(navigator.userAgent)
)

const hasWebPushAPIs = () => (
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
)

export const supportsWebPush = () => window.isSecureContext && hasWebPushAPIs()

export const getPushPermission = (): PushPermissionState => {
  if (!window.isSecureContext) return 'insecure-context'
  if (hasWebPushAPIs()) return Notification.permission
  if (isEmbeddedBrowser()) return 'embedded-browser'
  if (isIOSDevice() && !isStandaloneApp()) return 'ios-install-required'
  return 'unsupported'
}

const unavailableMessage = (state: PushPermissionState) => {
  if (state === 'insecure-context') {
    return 'Thông báo đẩy chỉ hoạt động trên HTTPS hoặc localhost.'
  }
  if (state === 'ios-install-required') {
    return 'Trên iPhone/iPad, hãy thêm Rubeanora vào Màn hình chính rồi mở ứng dụng để bật thông báo.'
  }
  if (state === 'embedded-browser') {
    return 'Hãy mở website bằng Chrome hoặc Safari thay vì trình duyệt bên trong Zalo, Facebook hay Instagram.'
  }
  return 'Trình duyệt hoặc phiên bản hệ điều hành này chưa hỗ trợ thông báo đẩy.'
}

export const registerPushWorker = async () => {
  if (!window.isSecureContext || !('serviceWorker' in navigator)) return null
  return navigator.serviceWorker.register('/sw.js', { scope: '/' })
}

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
  const pushState = getPushPermission()
  if (!supportsWebPush()) throw new Error(unavailableMessage(pushState))
  if (!vapidPublicKey) throw new Error('Frontend chưa cấu hình VITE_VAPID_PUBLIC_KEY.')

  let permission = Notification.permission
  if (requestPermission && permission === 'default') permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    if (permission === 'denied') throw new Error('Thông báo đang bị chặn trong cài đặt trình duyệt.')
    return { subscribed: false, permission }
  }

  const registration = await registerPushWorker()
  if (!registration) throw new Error('Không thể đăng ký dịch vụ nhận thông báo trên trình duyệt này.')
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
