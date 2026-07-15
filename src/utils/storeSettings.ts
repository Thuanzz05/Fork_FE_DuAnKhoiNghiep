import { useEffect, useState } from 'react'

export interface StoreSettings {
  storeName: string
  legalName: string
  storeDescription: string
  logo: string
  hotline: string
  contactEmail: string
  supportEmail: string
  address: string
  businessHours: string
  mapEmbedUrl: string
  orderPrefix: string
  standardShippingFee: number
  freeShippingThreshold: number
  freeShippingEnabled: boolean
  codEnabled: boolean
  bankTransferEnabled: boolean
  momoEnabled: boolean
  vnpayEnabled: boolean
  notificationEmail: string
  notifyNewOrder: boolean
  notifyLowStock: boolean
  notifyNewReview: boolean
  sendOrderConfirmation: boolean
  facebookUrl: string
  instagramUrl: string
  youtubeUrl: string
  tiktokUrl: string
  maintenanceMode: boolean
}

const STORE_SETTINGS_KEY = 'rubeanora-store-settings'
export const STORE_SETTINGS_EVENT = 'store-settings-updated'
const LEGACY_STORE_DESCRIPTION = 'Mỹ phẩm chăm sóc da từ hạt đậu đỏ Việt Nam, dịu nhẹ và phù hợp với mọi loại da.'

export const defaultStoreSettings: StoreSettings = {
  storeName: 'Rubeanora',
  legalName: 'Red Bean Beauty',
  storeDescription: 'Rubeanora phát triển các sản phẩm chăm sóc da từ hạt đậu đỏ Việt Nam, kết hợp cùng những thành phần thiên nhiên được chọn lọc. Công thức dịu nhẹ giúp làm sạch, cấp ẩm và nuôi dưỡng làn da sáng khỏe mỗi ngày. Sản phẩm không chứa Sulfate, Paraben hay Alcohol, phù hợp với nhiều loại da, kể cả làn da nhạy cảm.',
  logo: '/images/logo1.png',
  hotline: '0986126955',
  contactEmail: 'Hoangthingocmai2005@gmail.com',
  supportEmail: 'Hoangthingocmai2005@gmail.com',
  address: 'Cầu Treo, Yên Mỹ, Hưng Yên',
  businessHours: '08:00 - 21:00, Thứ Hai - Chủ Nhật',
  mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3727.4907528986323!2d106.04288550000001!3d20.8925666!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135bb004441baf7%3A0xf0fb155ce48f80cb!2zQ-G7jyBDw6J5IEhvYSBMw6EgSMawbmcgWcOqbiAtIE5ow6AgcGjDom4gcGjhu5FpIEh14buHIExhbg!5e0!3m2!1svi!2s!4v1783694055196!5m2!1svi!2s',
  orderPrefix: 'RBB',
  standardShippingFee: 30000,
  freeShippingThreshold: 300000,
  freeShippingEnabled: true,
  codEnabled: true,
  bankTransferEnabled: true,
  momoEnabled: true,
  vnpayEnabled: true,
  notificationEmail: 'Hoangthingocmai2005@gmail.com',
  notifyNewOrder: true,
  notifyLowStock: true,
  notifyNewReview: true,
  sendOrderConfirmation: true,
  facebookUrl: 'https://facebook.com/',
  instagramUrl: 'https://instagram.com/',
  youtubeUrl: 'https://youtube.com/',
  tiktokUrl: 'https://tiktok.com/',
  maintenanceMode: false,
}

export const getStoreSettings = (): StoreSettings => {
  if (typeof window === 'undefined') return defaultStoreSettings
  try {
    const raw = localStorage.getItem(STORE_SETTINGS_KEY)
    if (!raw) return defaultStoreSettings
    const savedSettings = JSON.parse(raw) as Partial<StoreSettings>
    const mergedSettings = { ...defaultStoreSettings, ...savedSettings }
    if (savedSettings.storeDescription === LEGACY_STORE_DESCRIPTION) {
      mergedSettings.storeDescription = defaultStoreSettings.storeDescription
    }
    return mergedSettings
  } catch {
    return defaultStoreSettings
  }
}

export const saveStoreSettings = (settings: StoreSettings): StoreSettings => {
  localStorage.setItem(STORE_SETTINGS_KEY, JSON.stringify(settings))
  window.dispatchEvent(new CustomEvent<StoreSettings>(STORE_SETTINGS_EVENT, { detail: settings }))
  return settings
}

export const resetStoreSettings = (): StoreSettings => {
  localStorage.removeItem(STORE_SETTINGS_KEY)
  window.dispatchEvent(new CustomEvent<StoreSettings>(STORE_SETTINGS_EVENT, { detail: defaultStoreSettings }))
  return defaultStoreSettings
}

export const useStoreSettings = () => {
  const [settings, setSettings] = useState<StoreSettings>(getStoreSettings)

  useEffect(() => {
    const syncSettings = () => setSettings(getStoreSettings())
    const handleSettingsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<StoreSettings>
      setSettings(customEvent.detail ?? getStoreSettings())
    }
    window.addEventListener('storage', syncSettings)
    window.addEventListener(STORE_SETTINGS_EVENT, handleSettingsUpdated)
    return () => {
      window.removeEventListener('storage', syncSettings)
      window.removeEventListener(STORE_SETTINGS_EVENT, handleSettingsUpdated)
    }
  }, [])

  return settings
}
