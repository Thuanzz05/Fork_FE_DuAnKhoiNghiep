import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { getCurrentUser } from '../utils/auth'
import { apiRequest } from '../services/api'
import './CustomerChatWidget.css'

type ChatForm = { fullName: string; email: string; phone: string; message: string }
type Reply = { id: string; content: string; sentAt: string; sender: string; direction?: 'ADMIN' | 'CUSTOMER'; readAt?: string | null }
type Conversation = { id: string; subject?: string; content: string; status: string; createdAt: string; replies: Reply[] }
type SupportResult = { conversations: Conversation[] }
type SubmitResult = { id: string; status: string; continued?: boolean }
const emptyForm: ChatForm = { fullName: '', email: '', phone: '', message: '' }
const formatTime = (value: string) => new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }).format(new Date(value))

function CustomerChatWidget() {
  const [user, setUser] = useState(() => getCurrentUser())
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState<ChatForm>(emptyForm)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const historyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const syncAuthUser = () => setUser(getCurrentUser())
    window.addEventListener('auth-updated', syncAuthUser)
    return () => window.removeEventListener('auth-updated', syncAuthUser)
  }, [])

  useEffect(() => {
    if (!user) return
    const fullName = [user.lastName, user.firstName].filter(Boolean).join(' ').trim()
    setForm((current) => ({ ...current, fullName: fullName || user.email.split('@')[0], email: user.email || '', phone: user.phone ?? '' }))
  }, [user])

  const loadMessages = useCallback(async () => {
    if (!user) return
    try {
      const data = await apiRequest<SupportResult>('/customers/me/support-messages')
      const next = data.conversations || []
      setConversations((current) => JSON.stringify(current) === JSON.stringify(next) ? current : next)
    } catch {
      // Polling âm thầm; lỗi gửi vẫn được hiển thị riêng trong biểu mẫu.
    }
  }, [user])

  useEffect(() => {
    void loadMessages()
    if (!user) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadMessages()
    }, 3000)
    const refreshWhenActive = () => {
      if (document.visibilityState === 'visible') void loadMessages()
    }
    window.addEventListener('focus', refreshWhenActive)
    document.addEventListener('visibilitychange', refreshWhenActive)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refreshWhenActive)
      document.removeEventListener('visibilitychange', refreshWhenActive)
    }
  }, [loadMessages, user])

  const unreadCount = useMemo(() => conversations.reduce((total, conversation) => (
    total + conversation.replies.filter((reply) => reply.direction !== 'CUSTOMER' && !reply.readAt).length
  ), 0), [conversations])

  useEffect(() => {
    if (!isOpen) return
    historyRef.current?.scrollTo({ top: historyRef.current.scrollHeight, behavior: 'smooth' })
  }, [conversations, isOpen])

  const openChat = async () => {
    setIsOpen(true)
    if (!user || unreadCount === 0) return
    setConversations((items) => items.map((conversation) => ({
      ...conversation,
      replies: conversation.replies.map((reply) => ({ ...reply, readAt: reply.readAt || new Date().toISOString() })),
    })))
    try {
      await apiRequest('/customers/me/support-messages/read', { method: 'PATCH' })
    } catch {
      void loadMessages()
    }
  }

  const updateField = (field: keyof ChatForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setNotice(null)
  }

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sending) return
    setSending(true)
    setNotice(null)
    try {
      const sentMessage = form.message.trim()
      const result = await apiRequest<SubmitResult>('/contact', { method: 'POST', body: JSON.stringify({ ...form, message: sentMessage, subject: 'Yêu cầu hỗ trợ từ hộp chat' }) })
      const sentAt = new Date().toISOString()
      setConversations((items) => {
        const existing = items.find((item) => item.id === result.id)
        if (result.continued && existing) return items.map((item) => item.id === result.id ? {
          ...item,
          status: result.status,
          replies: [...item.replies, { id: `customer-${Date.now()}`, content: sentMessage, sentAt, sender: form.fullName, direction: 'CUSTOMER' }],
        } : item)
        return [...items, {
          id: result.id,
          subject: 'Yêu cầu hỗ trợ từ hộp chat',
          content: sentMessage,
          status: result.status,
          createdAt: sentAt,
          replies: [],
        }]
      })
      setForm((current) => ({ ...current, message: '' }))
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Không thể gửi tin nhắn' })
    } finally { setSending(false) }
  }

  return <div className={`customer-chat${isOpen ? ' is-open' : ''}`}>
    {!isOpen && unreadCount > 0 && <button className="customer-chat-alert" type="button" onClick={() => void openChat()}><strong>Bạn có {unreadCount} phản hồi mới</strong><span>Nhấn để xem tin nhắn từ Rubeanora</span></button>}
    {isOpen && <section className="customer-chat-panel" aria-label="Hộp liên hệ hỗ trợ">
      <header><span className="customer-chat-avatar">R</span><div><strong>Rubeanora hỗ trợ</strong><small><i /> Thường phản hồi sớm</small></div><button type="button" onClick={() => setIsOpen(false)} aria-label="Đóng">×</button></header>
      <div className="customer-chat-history" ref={historyRef}>
        <div className="customer-chat-intro">Xin chào! Bạn đang cần Rubeanora tư vấn điều gì?</div>
        {conversations.map((conversation) => <div className="customer-chat-thread" key={conversation.id}>
          <div className="customer-chat-bubble is-customer"><p>{conversation.content}</p><time>{formatTime(conversation.createdAt)}</time></div>
          {conversation.replies.map((reply) => <div className={`customer-chat-bubble is-${reply.direction === 'CUSTOMER' ? 'customer' : 'support'}`} key={reply.id}>{reply.direction !== 'CUSTOMER' && <strong>Rubeanora hỗ trợ</strong>}<p>{reply.content}</p><time>{formatTime(reply.sentAt)}</time></div>)}
        </div>)}
      </div>
      <form onSubmit={submitMessage}>
        {!user && <div className="customer-chat-fields">
          <input value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} placeholder="Họ và tên *" required maxLength={150} />
          <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="Email *" required maxLength={150} />
          <input type="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="Số điện thoại" maxLength={20} />
        </div>}
        <div className="customer-chat-compose"><textarea value={form.message} onChange={(e) => updateField('message', e.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} placeholder="Nhập tin nhắn..." required rows={2} maxLength={2000} /><button className="customer-chat-submit" type="submit" disabled={sending || !form.message.trim()}>{sending ? 'Đang gửi...' : 'Gửi'}</button></div>
        {notice && <p className={`customer-chat-notice is-${notice.type}`}>{notice.text}</p>}
      </form>
    </section>}
    <button className="customer-chat-toggle" type="button" onClick={() => isOpen ? setIsOpen(false) : void openChat()} aria-label={isOpen ? 'Đóng hộp liên hệ' : 'Mở hộp liên hệ'}>
      {unreadCount > 0 && !isOpen && <b className="customer-chat-badge">{unreadCount > 9 ? '9+' : unreadCount}</b>}
      {isOpen ? <span>×</span> : <svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /><path d="M8 9h8M8 13h5" /></svg>}
    </button>
  </div>
}
export default CustomerChatWidget
