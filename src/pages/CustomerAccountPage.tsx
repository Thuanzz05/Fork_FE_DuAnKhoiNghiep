import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import CustomerAccountSidebar from '../components/CustomerAccountSidebar'
import type { AuthUser, CustomerAddress } from '../utils/auth'
import {
  addUserAddress,
  getCurrentUser,
  getUserInitial,
  makeUserAddressDefault,
  removeUserAddress,
  updateProfile,
} from '../utils/auth'
import { apiRequest, resolveApiUrl } from '../services/api'
import './CustomerAccountPage.css'

type AdministrativeUnit = {
  code: string
  name: string
  type: string
}

type ApiResponse = {
  success: boolean
  data: AdministrativeUnit[]
}

const ADDRESS_API_BASE = 'https://tinhthanhpho.com/api/v1'

function CustomerAccountPage() {
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser())
  const [profileNotice, setProfileNotice] = useState('')
  const [addressNotice, setAddressNotice] = useState('')
  const [addressFormOpen, setAddressFormOpen] = useState(false)
  const [provinces, setProvinces] = useState<AdministrativeUnit[]>([])
  const [wards, setWards] = useState<AdministrativeUnit[]>([])
  const [provinceCode, setProvinceCode] = useState('')
  const [wardCode, setWardCode] = useState('')
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressApiError, setAddressApiError] = useState('')

  const loadProvinces = async () => {
    setAddressLoading(true)
    setAddressApiError('')
    try {
      const response = await fetch(`${ADDRESS_API_BASE}/new-provinces?limit=100`, {
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('Không thể tải tỉnh/thành phố')
      const result = (await response.json()) as ApiResponse
      setProvinces(result.data || [])
    } catch {
      setAddressApiError('Không thể tải dữ liệu địa chỉ. Vui lòng thử lại.')
    } finally {
      setAddressLoading(false)
    }
  }

  useEffect(() => {
    void loadProvinces()
  }, [])

  useEffect(() => {
    if (!provinceCode) {
      setWards([])
      setWardCode('')
      return
    }

    const loadWards = async () => {
      setAddressLoading(true)
      setAddressApiError('')
      try {
        const response = await fetch(`${ADDRESS_API_BASE}/new-provinces/${provinceCode}/wards?limit=500`, {
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) throw new Error('Không thể tải phường/xã')
        const result = (await response.json()) as ApiResponse
        setWards(result.data || [])
        setWardCode('')
      } catch {
        setWards([])
        setAddressApiError('Không thể tải danh sách phường/xã. Vui lòng thử lại.')
      } finally {
        setAddressLoading(false)
      }
    }

    void loadWards()
  }, [provinceCode])

  if (!user) return <Navigate to="/tai-khoan?che-do=dang-nhap" replace />

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    try {
      const nextUser = await updateProfile({
        lastName: String(formData.get('lastName') || '').trim(),
        firstName: String(formData.get('firstName') || '').trim(),
        phone: String(formData.get('phone') || '').trim(),
        email: String(formData.get('email') || '').trim().toLowerCase(),
        avatar: user.avatar,
      })
      setUser(nextUser)
      setProfileNotice('Thông tin tài khoản đã được cập nhật.')
    } catch (error) {
      setProfileNotice(error instanceof Error ? error.message : 'Không thể cập nhật tài khoản.')
    }
  }

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) {
      setProfileNotice('Ảnh đại diện cần nhỏ hơn 500 KB.')
      return
    }
    try {
        const uploaded = await apiRequest<{ url: string }>('/customers/me/uploads/images', {
          method: 'POST', headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) }, body: file,
        })
        const nextUser = await updateProfile({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          avatar: resolveApiUrl(uploaded.url),
        })
        setUser(nextUser)
        setProfileNotice('Ảnh đại diện đã được cập nhật.')
    } catch (error) {
        setProfileNotice(error instanceof Error ? error.message : 'Không thể cập nhật ảnh đại diện.')
    }
    event.target.value = ''
  }

  const handleAddressSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const province = provinces.find((item) => item.code === provinceCode)
    const ward = wards.find((item) => item.code === wardCode)
    if (!province || !ward) {
      setAddressNotice('Vui lòng chọn đầy đủ tỉnh/thành phố và phường/xã.')
      return
    }

    const isFirstAddress = user.addresses.length === 0
    const makeDefault = isFirstAddress || formData.get('isDefault') === 'on'
    const address: Omit<CustomerAddress, 'id'> = {
      recipientName: String(formData.get('recipientName') || '').trim(),
      phone: String(formData.get('addressPhone') || '').trim(),
      provinceCode,
      provinceName: `${province.type} ${province.name}`.trim(),
      wardCode,
      wardName: `${ward.type} ${ward.name}`.trim(),
      detail: String(formData.get('detail') || '').trim(),
      isDefault: makeDefault,
    }

    try {
      setUser(await addUserAddress(address))
    } catch (error) {
      setAddressNotice(error instanceof Error ? error.message : 'Không thể thêm địa chỉ.')
      return
    }
    event.currentTarget.reset()
    setProvinceCode('')
    setWardCode('')
    setAddressFormOpen(false)
    setAddressNotice('Địa chỉ mới đã được thêm vào sổ địa chỉ.')
  }

  const setDefaultAddress = async (addressId: string) => {
    try {
      setUser(await makeUserAddressDefault(addressId))
      setAddressNotice('Đã đặt làm địa chỉ giao hàng mặc định.')
    } catch (error) {
      setAddressNotice(error instanceof Error ? error.message : 'Không thể cập nhật địa chỉ.')
    }
  }

  const deleteAddress = async (addressId: string) => {
    try {
      setUser(await removeUserAddress(addressId))
      setAddressNotice('Địa chỉ đã được xóa.')
    } catch (error) {
      setAddressNotice(error instanceof Error ? error.message : 'Không thể xóa địa chỉ.')
    }
  }

  const removeAvatar = async () => {
    try {
      const nextUser = await updateProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatar: '',
      })
      setUser(nextUser)
      setProfileNotice('Đã dùng ảnh đại diện mặc định.')
    } catch (error) {
      setProfileNotice(error instanceof Error ? error.message : 'Không thể cập nhật ảnh đại diện.')
    }
  }

  return (
    <main className="customer-account-page">
      <div className="customer-account-container customer-account-layout">
        <CustomerAccountSidebar user={user} />

        <div className="customer-account-main">
          <section className="customer-panel">
            <div className="customer-panel-heading">
              <div>
                <p>Tài khoản của tôi</p>
                <h1>Thông tin cá nhân</h1>
              </div>
            </div>

            <div className="profile-editor">
              <div className="profile-avatar-editor">
                <div className="profile-large-avatar">
                  {user.avatar ? <img src={user.avatar} alt="Ảnh đại diện" /> : <span>{getUserInitial(user)}</span>}
                </div>
                <label className="avatar-upload-button">
                  Thay ảnh đại diện
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} />
                </label>
                {user.avatar && <button type="button" onClick={() => void removeAvatar()}>Dùng avatar mặc định</button>}
                <small>Ảnh JPG, PNG hoặc WEBP, tối đa 1,5 MB.</small>
              </div>

              <form className="profile-form" onSubmit={handleProfileSubmit}>
                <div className="customer-form-row">
                  <label><span>Họ</span><input name="lastName" defaultValue={user.lastName} placeholder="Nhập họ" /></label>
                  <label><span>Tên</span><input name="firstName" defaultValue={user.firstName} placeholder="Nhập tên" required /></label>
                </div>
                <label><span>Số điện thoại</span><input type="tel" name="phone" defaultValue={user.phone} placeholder="Nhập số điện thoại" pattern="[0-9]{9,11}" /></label>
                <label><span>Email</span><input type="email" name="email" defaultValue={user.email} required /></label>
                <button className="customer-primary-button" type="submit">Lưu thay đổi</button>
              </form>
            </div>
            {profileNotice && <p className="customer-success" role="status">{profileNotice}</p>}
          </section>

          <section className="customer-panel address-panel">
            <div className="customer-panel-heading">
              <div><p>Thông tin giao hàng</p><h2>Sổ địa chỉ</h2></div>
              <button className="add-address-button" type="button" onClick={() => setAddressFormOpen((open) => !open)}>
                {addressFormOpen ? 'Đóng' : '+ Thêm địa chỉ'}
              </button>
            </div>

            {addressFormOpen && (
              <form className="address-form" onSubmit={handleAddressSubmit}>
                <div className="customer-form-row">
                  <label><span>Họ tên người nhận *</span><input name="recipientName" defaultValue={`${user.lastName} ${user.firstName}`.trim()} required /></label>
                  <label><span>Số điện thoại *</span><input type="tel" name="addressPhone" defaultValue={user.phone} pattern="[0-9]{9,11}" required /></label>
                </div>
                <div className="customer-form-row">
                  <label>
                    <span>Tỉnh/Thành phố *</span>
                    <select value={provinceCode} onChange={(event) => setProvinceCode(event.target.value)} disabled={addressLoading && provinces.length === 0} required>
                      <option value="">Chọn tỉnh/thành phố</option>
                      {provinces.map((item) => <option value={item.code} key={item.code}>{item.type} {item.name}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Phường/Xã *</span>
                    <select value={wardCode} onChange={(event) => setWardCode(event.target.value)} disabled={!provinceCode || addressLoading} required>
                      <option value="">Chọn phường/xã</option>
                      {wards.map((item) => <option value={item.code} key={item.code}>{item.type} {item.name}</option>)}
                    </select>
                  </label>
                </div>
                <label><span>Số nhà, tên đường *</span><input name="detail" placeholder="Ví dụ: Số 12, đường Nguyễn Văn A" required /></label>
                <label className="default-address-checkbox"><input type="checkbox" name="isDefault" /><span>Đặt làm địa chỉ giao hàng mặc định</span></label>
                {addressApiError && <div className="address-api-error">{addressApiError} <button type="button" onClick={() => void loadProvinces()}>Thử lại</button></div>}
                <button className="customer-primary-button" type="submit" disabled={addressLoading || !!addressApiError}>Lưu địa chỉ</button>
              </form>
            )}

            {addressNotice && <p className="customer-success" role="status">{addressNotice}</p>}

            <div className="address-list">
              {user.addresses.length === 0 ? (
                <div className="address-empty">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                  <p>Bạn chưa có địa chỉ giao hàng.</p>
                </div>
              ) : user.addresses.map((address) => (
                <article className={`customer-address-card${address.isDefault ? ' default' : ''}`} key={address.id}>
                  <div className="address-card-title">
                    <strong>{address.recipientName}</strong>
                    {address.isDefault && <span>Mặc định</span>}
                  </div>
                  <p>{address.phone}</p>
                  <p>{address.detail}, {address.wardName}, {address.provinceName}</p>
                  <div className="address-card-actions">
                    {!address.isDefault && <button type="button" onClick={() => setDefaultAddress(address.id)}>Đặt làm mặc định</button>}
                    <button type="button" className="delete-address" onClick={() => deleteAddress(address.id)}>Xóa</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

export default CustomerAccountPage
