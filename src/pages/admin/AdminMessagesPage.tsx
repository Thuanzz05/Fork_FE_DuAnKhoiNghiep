import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AdminLayout, { AdminIcon } from '../../components/AdminLayout'
import { apiRequest } from '../../services/api'
import './AdminMessagesPage.css'

type Status = 'MOI' | 'DANG_XU_LY' | 'DA_XU_LY'
type Message = {
  id: string
  fullName: string
  email: string
  phone?: string
  subject?: string
  content: string
  status: Status
  adminNote?: string
  handledBy?: string
  createdAt: string
  threadMessages?: AdminReply[]
}
type Result = { items: Message[]; pagination: { total: number } }
type AdminReply = { id: string; content: string; sentAt: string; sender: string; direction?: 'ADMIN' | 'CUSTOMER'; readAt?: string | null }

const statusMeta: Record<Status, { label: string; tone: string }> = {
  MOI: { label: 'Tin mới', tone: 'new' },
  DANG_XU_LY: { label: 'Đang xử lý', tone: 'processing' },
  DA_XU_LY: { label: 'Đã xử lý', tone: 'done' },
}

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
}).format(new Date(value))

const getReplies = (message: Message): AdminReply[] => {
  if (!message.adminNote) return []
  try {
    const parsed = JSON.parse(message.adminNote) as { replies?: AdminReply[] }
    if (Array.isArray(parsed.replies)) return parsed.replies
  } catch {
    // Dữ liệu cũ chỉ có một ghi chú dạng văn bản.
  }
  return [{ id: `legacy-${message.id}`, content: message.adminNote, sentAt: message.createdAt, sender: message.handledBy || 'Nhân viên hỗ trợ', direction: 'ADMIN' }]
}

const getThreadMessages = (message: Message): AdminReply[] => message.threadMessages?.length
  ? message.threadMessages
  : [{ id: `contact-${message.id}`, content: message.content, sentAt: message.createdAt, sender: message.fullName, direction: 'CUSTOMER' }, ...getReplies(message)]

function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | Status>('ALL')
  const [search, setSearch] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const conversationBodyRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const data = await apiRequest<Result>('/admin/contacts?limit=100')
      setMessages((current) => JSON.stringify(current) === JSON.stringify(data.items) ? current : data.items)
      setError('')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải tin nhắn')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, 3000)
    const refreshWhenActive = () => {
      if (document.visibilityState === 'visible') void load()
    }
    window.addEventListener('focus', refreshWhenActive)
    document.addEventListener('visibilitychange', refreshWhenActive)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refreshWhenActive)
      document.removeEventListener('visibilitychange', refreshWhenActive)
    }
  }, [load])

  const conversations = useMemo(() => {
    const grouped = new Map<string, Message>()
    messages.forEach((message) => {
      const key = message.email.trim().toLocaleLowerCase('vi')
      const current = grouped.get(key)
      if (!current) {
        grouped.set(key, { ...message, threadMessages: [...getThreadMessages(message)] })
        return
      }
      const messageIsNewer = new Date(message.createdAt).getTime() > new Date(current.createdAt).getTime()
      const latest = messageIsNewer ? message : current
      grouped.set(key, {
        ...latest,
        threadMessages: [...getThreadMessages(current), ...getThreadMessages(message)]
          .filter((entry, index, entries) => entries.findIndex((item) => item.id === entry.id) === index)
          .sort((left, right) => new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime()),
      })
    })
    return [...grouped.values()].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
  }, [messages])

  const filtered = useMemo(() => {
    const key = search.trim().toLocaleLowerCase('vi')
    return conversations.filter((message) => (
      (filter === 'ALL' || message.status === filter)
      && (!key || [message.fullName, message.email, message.phone ?? '', message.content]
        .some((value) => value.toLocaleLowerCase('vi').includes(key)))
    ))
  }, [conversations, filter, search])

  const selected = conversations.find((message) => message.id === selectedId) ?? null
  const selectedLastMessageId = selected ? getThreadMessages(selected).at(-1)?.id : undefined

  useEffect(() => {
    if (!selectedId) return
    window.requestAnimationFrame(() => {
      const body = conversationBodyRef.current
      if (body) body.scrollTop = body.scrollHeight
    })
  }, [selectedId, selectedLastMessageId])

  const count = (status?: Status) => status
    ? conversations.filter((message) => message.status === status).length
    : conversations.length

  const update = async (message: Message, status: Status, sendReply = false) => {
    if (sendReply && !note.trim()) return
    setSaving(true)
    try {
      const replies = getReplies(message)
      if (sendReply) replies.push({
        id: `${Date.now()}`,
        content: note.trim(),
        sentAt: new Date().toISOString(),
        sender: 'Nhân viên hỗ trợ',
        direction: 'ADMIN',
      })
      const adminNote = JSON.stringify({ replies })
      await apiRequest(`/admin/contacts/${message.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, adminNote }),
      })
      const next = { ...message, status, adminNote }
      if (sendReply) next.threadMessages = [...getThreadMessages(message), replies.at(-1)!]
      setMessages((items) => items.map((item) => item.id === message.id ? next : item))
      if (sendReply) setNote('')
      setError('')
      window.dispatchEvent(new Event('admin-contacts-updated'))
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Không thể cập nhật tin nhắn')
    } finally {
      setSaving(false)
    }
  }

  const open = (message: Message) => {
    setSelectedId(message.id)
    setNote('')
    if (message.status === 'MOI') {
      setMessages((items) => items.map((item) => item.id === message.id
        ? { ...item, status: 'DANG_XU_LY' }
        : item))
      void apiRequest(`/admin/contacts/${message.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'DANG_XU_LY', adminNote: message.adminNote ?? '' }),
      }).then(() => window.dispatchEvent(new Event('admin-contacts-updated'))).catch(() => {
        setError('Không thể chuyển tin nhắn sang trạng thái đang xử lý')
      })
    }
  }

  const filters = [
    ['ALL', 'Tất cả', count()],
    ['MOI', 'Tin mới', count('MOI')],
    ['DANG_XU_LY', 'Đang xử lý', count('DANG_XU_LY')],
    ['DA_XU_LY', 'Đã xử lý', count('DA_XU_LY')],
  ] as const

  return (
    <AdminLayout
      activeItem="messages"
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Tìm tên, email, số điện thoại..."
    >
      <div className="admin-messages-heading">
        <div><span>CHĂM SÓC KHÁCH HÀNG</span><h1>Hộp thư hỗ trợ</h1><p>Quản lý và theo dõi yêu cầu khách hàng theo từng trạng thái.</p></div>
        <button type="button" onClick={() => void load()}>↻ Làm mới</button>
      </div>

      <div className="admin-message-filters" aria-label="Lọc trạng thái tin nhắn">
        {filters.map(([value, label, total]) => (
          <button key={value} className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)}>
            <span>{label}</span><strong>{total}</strong>
          </button>
        ))}
      </div>

      {error && <div className="admin-message-error" role="alert">{error}</div>}

      <section className={`admin-message-workspace${selected ? ' has-selection' : ''}`}>
        <aside className="admin-message-inbox">
          <header>
            <div><strong>Tin nhắn đến</strong><span>{filtered.length} hội thoại</span></div>
            <i>{count('MOI')} chưa đọc</i>
          </header>
          <div className="admin-message-list">
            {loading ? (
              <div className="admin-message-empty">Đang tải...</div>
            ) : filtered.length === 0 ? (
              <div className="admin-message-empty"><AdminIcon name="message" /><strong>Chưa có tin nhắn</strong></div>
            ) : filtered.map((message) => (
              <button
                className={`admin-message-row${message.status === 'MOI' ? ' is-unread' : ''}${selectedId === message.id ? ' is-selected' : ''}`}
                key={message.id}
                onClick={() => open(message)}
              >
                <span className="admin-message-avatar">{message.fullName.charAt(0).toLocaleUpperCase('vi')}</span>
                <span className="admin-message-copy">
                  <span><strong>{message.fullName}</strong><time>{formatDate(message.createdAt)}</time></span>
                  <b>{message.subject || 'Yêu cầu hỗ trợ'}</b>
                  <p>{getThreadMessages(message).at(-1)?.content || message.content}</p>
                  <i className={`is-${statusMeta[message.status].tone}`}>{statusMeta[message.status].label}</i>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <article className="admin-message-conversation">
          {selected ? (
            <>
              <header className="admin-conversation-header">
                <button className="admin-conversation-back" type="button" onClick={() => setSelectedId(null)} aria-label="Quay lại danh sách">←</button>
                <span className="admin-message-avatar">{selected.fullName.charAt(0).toLocaleUpperCase('vi')}</span>
                <div><strong>{selected.fullName}</strong><span>{selected.email}{selected.phone ? ` • ${selected.phone}` : ''}</span></div>
                <i className={`is-${statusMeta[selected.status].tone}`}>{statusMeta[selected.status].label}</i>
              </header>

              <div className="admin-conversation-body" ref={conversationBodyRef}>
                <div className="admin-conversation-date"><span>Lịch sử hội thoại</span></div>
                {getThreadMessages(selected).map((reply) => (
                  <div className={`admin-chat-message is-${reply.direction === 'CUSTOMER' ? 'customer' : 'admin'}`} key={reply.id}>
                    {reply.direction === 'CUSTOMER' && <span className="admin-message-avatar">{selected.fullName.charAt(0).toLocaleUpperCase('vi')}</span>}
                    <div><strong>{reply.direction === 'CUSTOMER' ? selected.fullName : 'Phản hồi hỗ trợ'}</strong><p>{reply.content}</p><small>{reply.sender} • {formatDate(reply.sentAt)}</small></div>
                  </div>
                ))}
              </div>

              <footer className="admin-conversation-compose">
                <label htmlFor="admin-message-note">Nội dung xử lý / phản hồi</label>
                <textarea id="admin-message-note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void update(selected, 'DANG_XU_LY', true) } }} placeholder="Nhập phản hồi cho khách hàng..." />
                <div>
                  <span>Mỗi lần gửi sẽ được thêm vào lịch sử hội thoại.</span>
                  <button type="button" className="is-send" disabled={saving || !note.trim()} onClick={() => void update(selected, 'DANG_XU_LY', true)}>{saving ? 'Đang gửi...' : 'Gửi'}</button>
                  <button type="button" className="is-complete" disabled={saving} onClick={() => void update(selected, 'DA_XU_LY')}>Hoàn tất</button>
                </div>
              </footer>
            </>
          ) : (
            <div className="admin-conversation-placeholder">
              <AdminIcon name="message" />
              <strong>Chọn một tin nhắn để xem nội dung</strong>
              <p>Thông tin khách hàng và lịch sử xử lý sẽ hiển thị tại đây.</p>
            </div>
          )}
        </article>
      </section>
    </AdminLayout>
  )
}

export default AdminMessagesPage
