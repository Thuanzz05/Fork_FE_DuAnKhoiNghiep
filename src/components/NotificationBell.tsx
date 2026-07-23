import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getNotifications,
  getPushPermission,
  markAllNotificationsRead,
  markNotificationRead,
  syncPushSubscription,
  type NotificationItem,
} from '../services/notifications'
import './NotificationBell.css'

type NotificationBellProps = { variant?: 'customer' | 'admin' }

const formatTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return 'Vừa xong'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`
  return date.toLocaleDateString('vi-VN')
}

const notificationSymbol = (type: string) => {
  if (type.includes('THANH_TOAN')) return '₫'
  if (type.includes('DON_HANG')) return '▣'
  if (type.includes('DANH_GIA')) return '★'
  if (type.includes('BINH_LUAN') || type.includes('LIEN_HE')) return '●'
  if (type.includes('HOAN_TIEN')) return '↩'
  return 'R'
}

function NotificationBell({ variant = 'customer' }: NotificationBellProps) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pushPermission, setPushPermission] = useState(getPushPermission)
  const [pushError, setPushError] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    try {
      const result = await getNotifications()
      setItems(result.items)
      setUnread(result.unread)
    } catch {
      setItems([])
      setUnread(0)
    }
  }, [])

  useEffect(() => {
    void load()
    if (getPushPermission() === 'granted') void syncPushSubscription(false).catch(() => undefined)
    const refresh = () => { if (document.visibilityState === 'visible') void load() }
    const timer = window.setInterval(refresh, 30000)
    const workerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'notification-received') void load()
    }
    window.addEventListener('focus', refresh)
    window.addEventListener('notifications-updated', refresh)
    navigator.serviceWorker?.addEventListener('message', workerMessage)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('notifications-updated', refresh)
      navigator.serviceWorker?.removeEventListener('message', workerMessage)
    }
  }, [load])

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const enablePush = async () => {
    setLoading(true)
    setPushError('')
    try {
      await syncPushSubscription(true)
      setPushPermission(getPushPermission())
    } catch (error) {
      setPushPermission(getPushPermission())
      setPushError(error instanceof Error ? error.message : 'Không thể bật thông báo.')
    } finally {
      setLoading(false)
    }
  }

  const readAll = async () => {
    if (!unread) return
    await markAllNotificationsRead()
    setItems((current) => current.map((item) => ({ ...item, read: true })))
    setUnread(0)
  }

  const openNotification = async (item: NotificationItem) => {
    if (!item.read) {
      await markNotificationRead(item.id).catch(() => undefined)
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry))
      setUnread((current) => Math.max(0, current - 1))
    }
    setIsOpen(false)
    if (item.path) navigate(item.path)
  }

  return (
    <div className={`notification-center notification-center--${variant}`} ref={wrapperRef}>
      <button
        type="button"
        className="notification-center__bell"
        aria-label={unread ? `${unread} thông báo chưa đọc` : 'Thông báo'}
        aria-expanded={isOpen}
        onClick={() => { setIsOpen((open) => !open); if (!isOpen) void load() }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
        {unread > 0 && <span className="notification-center__badge">{unread > 99 ? '99+' : unread}</span>}
      </button>

      {isOpen && (
        <section className="notification-center__panel" aria-label="Danh sách thông báo">
          <header className="notification-center__header">
            <div><strong>Thông báo</strong><small>{unread} chưa đọc</small></div>
            {unread > 0 && <button type="button" onClick={() => void readAll()}>Đọc tất cả</button>}
          </header>

          {pushPermission !== 'granted' && (
            <div className="notification-center__push">
              <div><strong>Nhận thông báo trên thiết bị</strong><small>Biết ngay khi đơn hàng hoặc tin nhắn có cập nhật.</small></div>
              {pushPermission === 'denied'
                ? <span>Hãy cho phép thông báo trong cài đặt trình duyệt.</span>
                : pushPermission === 'unsupported'
                  ? <span>Trình duyệt này chưa hỗ trợ Web Push.</span>
                  : <button type="button" disabled={loading} onClick={() => void enablePush()}>{loading ? 'Đang bật...' : 'Bật thông báo'}</button>}
              {pushError && <span className="notification-center__error">{pushError}</span>}
            </div>
          )}

          <div className="notification-center__list">
            {items.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`notification-center__item${item.read ? '' : ' is-unread'}`}
                onClick={() => void openNotification(item)}
              >
                <span className="notification-center__symbol">{notificationSymbol(item.type)}</span>
                <span className="notification-center__copy">
                  <strong>{item.title}</strong><span>{item.content}</span><small>{formatTime(item.createdAt)}</small>
                </span>
                {!item.read && <i aria-label="Chưa đọc" />}
              </button>
            ))}
            {!items.length && (
              <div className="notification-center__empty">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
                <p>Bạn chưa có thông báo nào.</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default NotificationBell
