import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import AdminLayout, { AdminIcon, type AdminIconName } from '../../components/AdminLayout'
import {
  defaultStoreSettings,
  getStoreSettings,
  resetStoreSettings,
  saveStoreSettings,
  type StoreSettings,
} from '../../utils/storeSettings'
import './AdminSettingsPage.css'

type SettingsSection = 'general' | 'contact' | 'sales' | 'notifications' | 'social'

const settingsSections: Array<{ id: SettingsSection; label: string; description: string; icon: AdminIconName }> = [
  { id: 'general', label: 'Thông tin chung', description: 'Tên, logo và nhận diện cửa hàng', icon: 'settings' },
  { id: 'contact', label: 'Liên hệ & địa chỉ', description: 'Hotline, email và bản đồ', icon: 'customers' },
  { id: 'sales', label: 'Bán hàng & vận chuyển', description: 'Phí giao hàng và thanh toán', icon: 'cart' },
  { id: 'notifications', label: 'Thông báo', description: 'Email và cảnh báo vận hành', icon: 'bell' },
  { id: 'social', label: 'Mạng xã hội', description: 'Các kênh truyền thông chính thức', icon: 'news' },
]

const formatMoney = (value: number) => `${Math.max(0, value || 0).toLocaleString('vi-VN')}đ`

function SettingToggle({ checked, onChange, label, description }: { checked: boolean; onChange: (checked: boolean) => void; label: string; description: string }) {
  return (
    <label className="admin-setting-toggle-row">
      <span><strong>{label}</strong><small>{description}</small></span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <i aria-hidden="true" />
    </label>
  )
}

function AdminSettingsPage() {
  const initialSettings = useMemo(() => getStoreSettings(), [])
  const [savedSettings, setSavedSettings] = useState<StoreSettings>(initialSettings)
  const [settings, setSettings] = useState<StoreSettings>(initialSettings)
  const [activeSection, setActiveSection] = useState<SettingsSection>('general')
  const [selectedLogoName, setSelectedLogoName] = useState('')
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const isDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings)

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2800)
    return () => window.clearTimeout(timer)
  }, [notice])

  const updateField = <K extends keyof StoreSettings>(field: K, value: StoreSettings[K]) => {
    setSettings((current) => ({ ...current, [field]: value }))
  }

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setNotice({ message: 'Vui lòng chọn đúng định dạng ảnh logo', type: 'error' })
      event.target.value = ''
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setNotice({ message: 'Ảnh logo không được vượt quá 3MB', type: 'error' })
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      updateField('logo', reader.result)
      setSelectedLogoName(file.name)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (!settings.storeName.trim() || !settings.hotline.trim() || !settings.contactEmail.trim()) {
      setNotice({ message: 'Vui lòng nhập tên cửa hàng, hotline và email liên hệ', type: 'error' })
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(settings.contactEmail) || !/^\S+@\S+\.\S+$/.test(settings.notificationEmail)) {
      setNotice({ message: 'Địa chỉ email chưa đúng định dạng', type: 'error' })
      return
    }
    if (![settings.codEnabled, settings.bankTransferEnabled, settings.momoEnabled, settings.vnpayEnabled].some(Boolean)) {
      setActiveSection('sales')
      setNotice({ message: 'Cần bật ít nhất một phương thức thanh toán', type: 'error' })
      return
    }
    const normalizedSettings: StoreSettings = {
      ...settings,
      storeName: settings.storeName.trim(),
      legalName: settings.legalName.trim(),
      hotline: settings.hotline.trim(),
      contactEmail: settings.contactEmail.trim(),
      supportEmail: settings.supportEmail.trim(),
      notificationEmail: settings.notificationEmail.trim(),
      address: settings.address.trim(),
      orderPrefix: settings.orderPrefix.trim().toLocaleUpperCase('vi-VN').replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'RBB',
      standardShippingFee: Math.max(0, Number(settings.standardShippingFee) || 0),
      freeShippingThreshold: Math.max(0, Number(settings.freeShippingThreshold) || 0),
    }
    saveStoreSettings(normalizedSettings)
    setSettings(normalizedSettings)
    setSavedSettings(normalizedSettings)
    setNotice({ message: 'Đã lưu và đồng bộ cài đặt cửa hàng', type: 'success' })
  }

  const handleReset = () => {
    if (!window.confirm('Khôi phục toàn bộ cài đặt cửa hàng về mặc định?')) return
    const defaults = resetStoreSettings()
    setSettings(defaults)
    setSavedSettings(defaults)
    setSelectedLogoName('')
    setNotice({ message: 'Đã khôi phục cài đặt mặc định', type: 'success' })
  }

  return (
    <AdminLayout activeItem="settings" searchPlaceholder="Tìm kiếm trong trang quản trị...">
      <div className="admin-page-heading admin-settings-heading">
        <div><p>THIẾT LẬP HỆ THỐNG</p><h1>Cài đặt cửa hàng</h1><span>Quản lý thông tin hiển thị và cấu hình vận hành chung.</span></div>
        <div className="admin-settings-heading-actions"><span className={isDirty ? 'is-dirty' : ''}><i />{isDirty ? 'Có thay đổi chưa lưu' : 'Đã lưu thay đổi'}</span><button type="button" className="admin-setting-primary" disabled={!isDirty} onClick={handleSave}><AdminIcon name="settings" />Lưu cài đặt</button></div>
      </div>

      <div className="admin-settings-layout">
        <aside className="admin-settings-menu" aria-label="Nhóm cài đặt">
          <div className="admin-settings-store-card">
            <div>{settings.logo ? <img src={settings.logo} alt="" /> : <AdminIcon name="settings" />}</div>
            <strong>{settings.storeName || 'Tên cửa hàng'}</strong>
            <span>{settings.maintenanceMode ? 'Đang bảo trì' : 'Cửa hàng đang hoạt động'}</span>
          </div>
          <nav>{settingsSections.map((section) => <button type="button" key={section.id} className={activeSection === section.id ? 'is-active' : ''} onClick={() => setActiveSection(section.id)}><AdminIcon name={section.icon} /><span><strong>{section.label}</strong><small>{section.description}</small></span><AdminIcon name="chevronDown" /></button>)}</nav>
          <button type="button" className="admin-settings-reset" onClick={handleReset}>Khôi phục mặc định</button>
        </aside>

        <section className="admin-settings-content">
          {activeSection === 'general' ? (
            <div className="admin-settings-section">
              <header><div><span>THÔNG TIN CHUNG</span><h2>Nhận diện cửa hàng</h2><p>Thông tin này được dùng trên Header, Footer và các trang liên hệ.</p></div></header>
              <div className="admin-settings-logo-field">
                <div className="admin-settings-logo-preview">{settings.logo ? <img src={settings.logo} alt="Logo xem trước" /> : <AdminIcon name="upload" />}</div>
                <div><strong>Logo cửa hàng</strong><p>Nên dùng ảnh PNG hoặc WEBP nền trong suốt, dung lượng dưới 3MB.</p><div><button type="button" onClick={() => logoInputRef.current?.click()}><AdminIcon name="upload" />Chọn ảnh từ máy</button><button type="button" onClick={() => { updateField('logo', defaultStoreSettings.logo); setSelectedLogoName('') }}>Dùng logo mặc định</button><input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoChange} /></div>{selectedLogoName ? <small>Đã chọn: {selectedLogoName}</small> : null}</div>
              </div>
              <div className="admin-settings-form-grid">
                <label><span>Tên hiển thị *</span><input required maxLength={80} value={settings.storeName} onChange={(event) => updateField('storeName', event.target.value)} /></label>
                <label><span>Tên pháp lý / dự án</span><input maxLength={120} value={settings.legalName} onChange={(event) => updateField('legalName', event.target.value)} /></label>
                <label className="is-wide"><span>Mô tả ngắn</span><textarea rows={4} maxLength={320} value={settings.storeDescription} onChange={(event) => updateField('storeDescription', event.target.value)} /><small>{settings.storeDescription.length}/320 ký tự</small></label>
              </div>
              <div className="admin-settings-subsection"><h3>Trạng thái cửa hàng</h3><SettingToggle checked={settings.maintenanceMode} onChange={(value) => updateField('maintenanceMode', value)} label="Chế độ bảo trì" description="Tạm thời đánh dấu cửa hàng đang bảo trì. Admin vẫn hoạt động bình thường." /></div>
            </div>
          ) : null}

          {activeSection === 'contact' ? (
            <div className="admin-settings-section">
              <header><div><span>LIÊN HỆ & ĐỊA CHỈ</span><h2>Thông tin chăm sóc khách hàng</h2><p>Được đồng bộ với Header, Footer và trang Liên hệ.</p></div></header>
              <div className="admin-settings-form-grid">
                <label><span>Hotline *</span><input type="tel" value={settings.hotline} onChange={(event) => updateField('hotline', event.target.value)} placeholder="0986126955" /></label>
                <label><span>Email liên hệ *</span><input type="email" value={settings.contactEmail} onChange={(event) => updateField('contactEmail', event.target.value)} /></label>
                <label><span>Email hỗ trợ</span><input type="email" value={settings.supportEmail} onChange={(event) => updateField('supportEmail', event.target.value)} /></label>
                <label><span>Giờ làm việc</span><input value={settings.businessHours} onChange={(event) => updateField('businessHours', event.target.value)} /></label>
                <label className="is-wide"><span>Địa chỉ cửa hàng *</span><textarea rows={3} value={settings.address} onChange={(event) => updateField('address', event.target.value)} /></label>
                <label className="is-wide"><span>Đường dẫn Google Maps Embed</span><textarea rows={4} value={settings.mapEmbedUrl} onChange={(event) => updateField('mapEmbedUrl', event.target.value)} /><small>Dán giá trị trong thuộc tính src của mã nhúng Google Maps.</small></label>
              </div>
            </div>
          ) : null}

          {activeSection === 'sales' ? (
            <div className="admin-settings-section">
              <header><div><span>BÁN HÀNG & VẬN CHUYỂN</span><h2>Cấu hình đơn hàng</h2><p>Thiết lập mã đơn, phí giao hàng và các phương thức thanh toán.</p></div></header>
              <div className="admin-settings-form-grid admin-settings-sales-grid">
                <label><span>Tiền tố mã đơn</span><input maxLength={8} value={settings.orderPrefix} onChange={(event) => updateField('orderPrefix', event.target.value.toLocaleUpperCase('vi-VN'))} /><small>Ví dụ: {settings.orderPrefix || 'RBB'}-123456</small></label>
                <label><span>Phí giao hàng tiêu chuẩn</span><div className="admin-setting-money-input"><input type="number" min="0" step="1000" value={settings.standardShippingFee} onChange={(event) => updateField('standardShippingFee', Number(event.target.value))} /><b>VNĐ</b></div><small>Hiện tại: {formatMoney(settings.standardShippingFee)}</small></label>
                <label><span>Miễn phí giao hàng từ</span><div className="admin-setting-money-input"><input type="number" min="0" step="10000" disabled={!settings.freeShippingEnabled} value={settings.freeShippingThreshold} onChange={(event) => updateField('freeShippingThreshold', Number(event.target.value))} /><b>VNĐ</b></div><small>Hiện tại: {formatMoney(settings.freeShippingThreshold)}</small></label>
              </div>
              <div className="admin-settings-subsection"><h3>Chính sách vận chuyển</h3><SettingToggle checked={settings.freeShippingEnabled} onChange={(value) => updateField('freeShippingEnabled', value)} label="Tự động miễn phí vận chuyển" description={`Áp dụng khi giá trị đơn đạt ${formatMoney(settings.freeShippingThreshold)}.`} /></div>
              <div className="admin-settings-subsection"><h3>Phương thức thanh toán</h3><div className="admin-settings-toggle-list"><SettingToggle checked={settings.codEnabled} onChange={(value) => updateField('codEnabled', value)} label="Thanh toán khi nhận hàng (COD)" description="Khách thanh toán trực tiếp cho đơn vị vận chuyển." /><SettingToggle checked={settings.bankTransferEnabled} onChange={(value) => updateField('bankTransferEnabled', value)} label="Chuyển khoản ngân hàng" description="Khách chuyển khoản trước khi cửa hàng giao hàng." /><SettingToggle checked={settings.momoEnabled} onChange={(value) => updateField('momoEnabled', value)} label="Ví điện tử MoMo" description="Cho phép lựa chọn MoMo tại trang thanh toán." /><SettingToggle checked={settings.vnpayEnabled} onChange={(value) => updateField('vnpayEnabled', value)} label="Cổng thanh toán VNPAY" description="Cho phép lựa chọn VNPAY tại trang thanh toán." /></div></div>
            </div>
          ) : null}

          {activeSection === 'notifications' ? (
            <div className="admin-settings-section">
              <header><div><span>THÔNG BÁO</span><h2>Cảnh báo vận hành</h2><p>Chọn các sự kiện cần gửi thông báo cho cửa hàng và khách hàng.</p></div></header>
              <div className="admin-settings-form-grid"><label className="is-wide"><span>Email nhận thông báo *</span><input type="email" value={settings.notificationEmail} onChange={(event) => updateField('notificationEmail', event.target.value)} /><small>Thông báo quản trị sẽ được gửi về địa chỉ này khi nối backend.</small></label></div>
              <div className="admin-settings-subsection"><h3>Thông báo cho quản trị viên</h3><div className="admin-settings-toggle-list"><SettingToggle checked={settings.notifyNewOrder} onChange={(value) => updateField('notifyNewOrder', value)} label="Có đơn hàng mới" description="Nhận thông báo ngay khi khách xác nhận đặt hàng." /><SettingToggle checked={settings.notifyLowStock} onChange={(value) => updateField('notifyLowStock', value)} label="Sản phẩm sắp hết hàng" description="Cảnh báo khi tồn kho của sản phẩm xuống mức thấp." /><SettingToggle checked={settings.notifyNewReview} onChange={(value) => updateField('notifyNewReview', value)} label="Có đánh giá mới" description="Nhận thông báo để kiểm duyệt và phản hồi khách hàng." /></div></div>
              <div className="admin-settings-subsection"><h3>Thông báo cho khách hàng</h3><SettingToggle checked={settings.sendOrderConfirmation} onChange={(value) => updateField('sendOrderConfirmation', value)} label="Xác nhận đơn hàng qua email" description="Gửi thông tin tóm tắt sau khi khách đặt hàng thành công." /></div>
            </div>
          ) : null}

          {activeSection === 'social' ? (
            <div className="admin-settings-section">
              <header><div><span>MẠNG XÃ HỘI</span><h2>Kênh truyền thông</h2><p>Các liên kết này được sử dụng tại khu vực mạng xã hội ở Footer.</p></div></header>
              <div className="admin-settings-form-grid">
                <label><span>Facebook</span><input type="url" value={settings.facebookUrl} onChange={(event) => updateField('facebookUrl', event.target.value)} placeholder="https://facebook.com/..." /></label>
                <label><span>Instagram</span><input type="url" value={settings.instagramUrl} onChange={(event) => updateField('instagramUrl', event.target.value)} placeholder="https://instagram.com/..." /></label>
                <label><span>YouTube</span><input type="url" value={settings.youtubeUrl} onChange={(event) => updateField('youtubeUrl', event.target.value)} placeholder="https://youtube.com/..." /></label>
                <label><span>TikTok</span><input type="url" value={settings.tiktokUrl} onChange={(event) => updateField('tiktokUrl', event.target.value)} placeholder="https://tiktok.com/..." /></label>
              </div>
              <div className="admin-settings-social-preview"><strong>Xem trước liên kết</strong><div>{[{ label: 'Facebook', url: settings.facebookUrl }, { label: 'Instagram', url: settings.instagramUrl }, { label: 'YouTube', url: settings.youtubeUrl }, { label: 'TikTok', url: settings.tiktokUrl }].map((item) => <a key={item.label} href={item.url || '#'} target="_blank" rel="noreferrer" className={!item.url ? 'is-disabled' : ''}>{item.label}<span>↗</span></a>)}</div></div>
            </div>
          ) : null}

          <footer className="admin-settings-content-footer"><div><strong>{isDirty ? 'Bạn có thay đổi chưa lưu' : 'Mọi thay đổi đã được lưu'}</strong><span>Cài đặt được lưu trên trình duyệt trong giai đoạn frontend.</span></div><button type="button" className="admin-setting-primary" disabled={!isDirty} onClick={handleSave}>Lưu cài đặt</button></footer>
        </section>
      </div>

      {notice ? <div className={`admin-setting-toast is-${notice.type}`} role="status"><span>{notice.type === 'success' ? '✓' : '!'}</span>{notice.message}</div> : null}
    </AdminLayout>
  )
}

export default AdminSettingsPage
