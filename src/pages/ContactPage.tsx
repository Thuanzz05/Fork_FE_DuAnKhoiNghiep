import { useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../services/api'
import { useStoreSettings } from '../utils/storeSettings'
import './ContactPage.css'

function ContactPage() {
  const storeSettings = useStoreSettings()
  const [submitted, setSubmitted] = useState(false)
  const [notice, setNotice] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    try {
      setNotice('Đang gửi thông tin...')
      await api.post('/contact', {
        fullName: String(formData.get('name') || ''),
        email: String(formData.get('email') || ''),
        phone: String(formData.get('phone') || ''),
        message: String(formData.get('message') || ''),
      })
      setSubmitted(true)
      setNotice('')
      form.reset()
    } catch (error) {
      setSubmitted(false)
      setNotice(error instanceof Error ? error.message : 'Không thể gửi liên hệ.')
    }
  }

  return (
    <main className="contact-page">
      <section className="contact-info-strip">
        <div className="contact-container contact-info-grid">
          <div className="contact-info-item">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22 16.92v2.4a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 3.6 2 2 0 0 1 4.1 1.42h2.4a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.61a2 2 0 0 1-.45 2.11L7.63 8.88a16 16 0 0 0 7.49 7.49l1.02-1.02a2 2 0 0 1 2.11-.45c.84.28 1.71.48 2.61.6A2 2 0 0 1 22 16.92Z" />
            </svg>
            <h2>Điện thoại</h2>
            <a href={`tel:${storeSettings.hotline}`}>{storeSettings.hotline}</a>
          </div>

          <div className="contact-info-item">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <h2>Địa chỉ</h2>
            <p>{storeSettings.address}</p>
          </div>

          <div className="contact-info-item">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 6h16v14H4z" />
              <path d="M4 8l8 6 8-6" />
              <path d="M8 4h8" />
              <path d="M9 2h6v4H9z" />
            </svg>
            <h2>Email</h2>
            <a href={`mailto:${storeSettings.contactEmail}`}>{storeSettings.contactEmail}</a>
          </div>
        </div>
      </section>

      <section className="contact-container contact-main">
        <div className="contact-map" id="contact-map">
          <iframe
            src={storeSettings.mapEmbedUrl}
            width="600"
            height="450"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            title={`Bản đồ ${storeSettings.storeName}`}
          />
        </div>

        <div className="contact-form-panel">
          <h1>Liên hệ chúng tôi</h1>
          <p>
            Để liên hệ và nhận các thông tin khuyến mãi sớm nhất, {storeSettings.storeName} sẽ liên lạc với bạn trong thời gian
            sớm nhất.
          </p>

          <form className="contact-form" onSubmit={handleSubmit}>
            <input type="text" name="name" placeholder="Họ và tên *" required />
            <input type="email" name="email" placeholder="Email *" required />
            <input type="tel" name="phone" placeholder="Số điện thoại *" required />
            <textarea name="message" placeholder="Nội dung *" rows={5} required />
            <button type="submit">Gửi liên hệ</button>
          </form>

          {submitted && <p className="contact-success">Cảm ơn bạn, {storeSettings.storeName} đã nhận được thông tin liên hệ.</p>}
          {notice && <p className="contact-success">{notice}</p>}
        </div>
      </section>

      <div className="contact-floating" aria-label="Liên hệ nhanh">
        <a className="floating-phone" href={`tel:${storeSettings.hotline}`} aria-label="Gọi điện">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22 16.92v2.4a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 3.6 2 2 0 0 1 4.1 1.42h2.4a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.61a2 2 0 0 1-.45 2.11L7.63 8.88a16 16 0 0 0 7.49 7.49l1.02-1.02a2 2 0 0 1 2.11-.45c.84.28 1.71.48 2.61.6A2 2 0 0 1 22 16.92Z" />
          </svg>
        </a>
        <a className="floating-mail" href={`mailto:${storeSettings.contactEmail}`} aria-label="Gửi email">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
        </a>
        <a className="floating-map" href="#contact-map" aria-label="Xem bản đồ">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </a>
      </div>
    </main>
  )
}

export default ContactPage
