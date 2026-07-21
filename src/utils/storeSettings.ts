import { useEffect, useState } from 'react'
import { api } from '../services/api'

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
  notificationEmail: string
  notifyNewOrder: boolean
  notifyLowStock: boolean
  notifyNewReview: boolean
  sendOrderConfirmation: boolean
  facebookUrl: string
  instagramUrl: string
  youtubeUrl: string
  tiktokUrl: string
  facebookEnabled: boolean
  instagramEnabled: boolean
  youtubeEnabled: boolean
  tiktokEnabled: boolean
  maintenanceMode: boolean
}

export const STORE_SETTINGS_EVENT = 'store-settings-updated'

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
  notificationEmail: 'Hoangthingocmai2005@gmail.com',
  notifyNewOrder: true,
  notifyLowStock: true,
  notifyNewReview: true,
  sendOrderConfirmation: true,
  facebookUrl: 'https://facebook.com/',
  instagramUrl: 'https://instagram.com/',
  youtubeUrl: 'https://youtube.com/',
  tiktokUrl: 'https://tiktok.com/',
  facebookEnabled: true,
  instagramEnabled: true,
  youtubeEnabled: true,
  tiktokEnabled: true,
  maintenanceMode: false,
}

let currentStoreSettings = defaultStoreSettings

type PublicStoreSettings = {
  storeName: string; logoUrl?: string; description?: string; hotline?: string; email?: string
  address?: string; workingHours?: string; shippingFee: number; freeShippingThreshold: number
  facebookUrl?: string; instagramUrl?: string; tiktokUrl?: string
  legalName?: string; supportEmail?: string; mapEmbedUrl?: string; orderPrefix?: string
  codEnabled?: boolean; bankTransferEnabled?: boolean; youtubeUrl?: string
  notificationEmail?: string; sendOrderConfirmation?: boolean; maintenanceMode?: boolean
}

const mapApiSettings = (data: PublicStoreSettings): StoreSettings => ({
  ...currentStoreSettings,
  storeName: data.storeName,
  logo: data.logoUrl || '',
  storeDescription: data.description || '',
  hotline: data.hotline || '',
  contactEmail: data.email || '',
  address: data.address || '',
  businessHours: data.workingHours || '',
  standardShippingFee: data.shippingFee,
  freeShippingThreshold: data.freeShippingThreshold,
  facebookUrl: data.facebookUrl || '',
  instagramUrl: data.instagramUrl || '',
  tiktokUrl: data.tiktokUrl || '',
  legalName: data.legalName || '', supportEmail: data.supportEmail || '', mapEmbedUrl: data.mapEmbedUrl || '',
  orderPrefix: data.orderPrefix || 'RBB', codEnabled: data.codEnabled ?? true,
  bankTransferEnabled: data.bankTransferEnabled ?? true, youtubeUrl: data.youtubeUrl || '',
  notificationEmail: data.notificationEmail || '', sendOrderConfirmation: data.sendOrderConfirmation ?? true,
  maintenanceMode: data.maintenanceMode ?? false,
})

export const getStoreSettings = (): StoreSettings => {
  return currentStoreSettings
}

export const saveStoreSettings = (settings: StoreSettings): StoreSettings => {
  currentStoreSettings = settings
  window.dispatchEvent(new CustomEvent<StoreSettings>(STORE_SETTINGS_EVENT, { detail: settings }))
  return settings
}

export const resetStoreSettings = (): StoreSettings => {
  currentStoreSettings = defaultStoreSettings
  window.dispatchEvent(new CustomEvent<StoreSettings>(STORE_SETTINGS_EVENT, { detail: defaultStoreSettings }))
  return defaultStoreSettings
}

export const loadStoreSettings = async () => {
  const data = await api.get<PublicStoreSettings>('/home/settings')
  return saveStoreSettings(mapApiSettings(data))
}

export const useStoreSettings = () => {
  const [settings, setSettings] = useState<StoreSettings>(getStoreSettings)

  useEffect(() => {
    const handleSettingsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<StoreSettings>
      setSettings(customEvent.detail ?? getStoreSettings())
    }
    window.addEventListener(STORE_SETTINGS_EVENT, handleSettingsUpdated)
    void loadStoreSettings().catch(() => undefined)
    return () => {
      window.removeEventListener(STORE_SETTINGS_EVENT, handleSettingsUpdated)
    }
  }, [])

  return settings
}
