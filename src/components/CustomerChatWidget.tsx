import { useEffect, useState, type FormEvent } from 'react'
import { getCurrentUser } from '../utils/auth'
import { apiRequest } from '../services/api'
import './CustomerChatWidget.css'

type ChatForm = { fullName: string; email: string; phone: string; message: string }
const emptyForm: ChatForm = { fullName: '', email: '', phone: '', message: '' }

function CustomerChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState<ChatForm>(emptyForm)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (user) setForm((current) => ({ ...current, fullName: `${user.lastName} ${user.firstName}`.trim(), email: user.email, phone: user.phone ?? '' }))
  }, [])

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
      await apiRequest('/contact', { method: 'POST', body: JSON.stringify({ ...form, subject: 'Yêu cầu hỗ trợ từ hộp chat' }) })
      setForm((current) => ({ ...current, message: '' }))
      setNotice({ type: 'success', text: 'Đã gửi tin nhắn. Chúng tôi sẽ liên hệ với bạn sớm nhất!' })
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Không thể gửi tin nhắn' })
    } finally { setSending(false) }
  }

  return <div className={`customer-chat${isOpen ? ' is-open' : ''}`}>
    {isOpen && <section className="customer-chat-panel" aria-label="Hộp liên hệ hỗ trợ">
      <header><span className="customer-chat-avatar">R</span><div><strong>Rubeanora hỗ trợ</strong><small><i /> Thường phản hồi sớm</small></div><button type="button" onClick={() => setIsOpen(false)} aria-label="Đóng">×</button></header>
      <div className="customer-chat-intro">Xin chào! Bạn đang cần Rubeanora tư vấn điều gì?</div>
      <form onSubmit={submitMessage}>
        <div className="customer-chat-fields">
          <input value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} placeholder="Họ và tên *" required maxLength={150} />
          <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="Email *" required maxLength={150} />
          <input type="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="Số điện thoại" maxLength={20} />
        </div>
        <textarea value={form.message} onChange={(e) => updateField('message', e.target.value)} placeholder="Nhập nội dung bạn cần hỗ trợ..." required rows={4} maxLength={2000} />
        {notice && <p className={`customer-chat-notice is-${notice.type}`}>{notice.text}</p>}
        <button className="customer-chat-submit" type="submit" disabled={sending}>{sending ? 'Đang gửi...' : 'Gửi cho tư vấn viên'}</button>
      </form>
    </section>}
    <button className="customer-chat-toggle" type="button" onClick={() => setIsOpen((value) => !value)} aria-label={isOpen ? 'Đóng hộp liên hệ' : 'Mở hộp liên hệ'}>{isOpen ? <span>×</span> : <svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /><path d="M8 9h8M8 13h5" /></svg>}</button>
  </div>
}
export default CustomerChatWidget
