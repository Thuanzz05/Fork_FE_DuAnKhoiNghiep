import { seedMockOrders } from './orders'

export type CustomerAddress = {
  id: string
  recipientName: string
  phone: string
  provinceCode: string
  provinceName: string
  wardCode: string
  wardName: string
  detail: string
  isDefault: boolean
}

export type AuthUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  avatar?: string
  addresses: CustomerAddress[]
}

type AuthSession = {
  user: AuthUser
  password: string
}

const AUTH_SESSION_KEY = 'red-bean-beauty-auth-session'
const AUTH_USERS_KEY = 'red-bean-beauty-auth-users'

const dispatchAuthUpdated = (session: AuthSession | null) => {
  window.dispatchEvent(new CustomEvent<AuthSession | null>('auth-updated', { detail: session }))
}

export const getAuthSession = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY)
    return raw ? (JSON.parse(raw) as AuthSession) : null
  } catch {
    return null
  }
}

const getStoredAccounts = (): Record<string, AuthSession> => {
  try {
    const raw = localStorage.getItem(AUTH_USERS_KEY)
    return raw ? (JSON.parse(raw) as Record<string, AuthSession>) : {}
  } catch {
    return {}
  }
}

const seedQuangUser = () => {
  if (typeof window === 'undefined') return
  try {
    const accounts = getStoredAccounts()
    const email = 'quang@gmail.com'
    if (!accounts[email]) {
      const user: AuthUser = {
        id: 'user-quang-demo',
        email,
        firstName: 'Quang',
        lastName: 'Lê Văn',
        phone: '0987654321',
        addresses: [
          {
            id: 'address-quang-default',
            recipientName: 'Lê Văn Quang',
            phone: '0987654321',
            provinceCode: '79',
            provinceName: 'Thành phố Hồ Chí Minh',
            wardCode: '26734',
            wardName: 'Phường Bến Thành',
            detail: 'Số 15, Đường Trần Hưng Đạo',
            isDefault: true,
          },
        ],
      }
      accounts[email] = { user, password: '123456' }
      localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(accounts))
    }
  } catch (e) {
    console.error('Error seeding demo user:', e)
  }
}

// Chạy gieo hạt ngay khi load file
seedQuangUser()

export const getCurrentUser = () => getAuthSession()?.user ?? null

export const getRegisteredUsers = (): AuthUser[] => Object.values(getStoredAccounts()).map((account) => account.user)

const saveSession = (session: AuthSession | null) => {
  if (session) {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
    const accounts = getStoredAccounts()
    accounts[session.user.email] = session
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(accounts))
  } else {
    localStorage.removeItem(AUTH_SESSION_KEY)
  }
  dispatchAuthUpdated(session)
}

const nameFromEmail = (email: string) => {
  const rawName = email.split('@')[0].replace(/[._-]+/g, ' ').trim()
  const words = rawName.split(' ').filter(Boolean)
  const firstName = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Khách hàng'
  return { firstName, lastName: '' }
}

export const loginDemo = (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase()
  const existingAccount = getStoredAccounts()[normalizedEmail]
  const existingUser = existingAccount?.user ?? null
  const generatedName = nameFromEmail(normalizedEmail)

  const user: AuthUser = existingUser ?? {
    id: `user-${Date.now()}`,
    email: normalizedEmail,
    firstName: generatedName.firstName,
    lastName: generatedName.lastName,
    phone: '',
    addresses: [],
  }

  // Tự động gieo hạt đơn hàng mẫu nếu đây là tài khoản quang@gmail.com
  if (normalizedEmail === 'quang@gmail.com') {
    seedMockOrders(user.id)
  }

  saveSession({ user, password: existingAccount?.password || password })
  return user
}

export const registerDemo = (data: Omit<AuthUser, 'id' | 'addresses'>, password: string) => {
  const user: AuthUser = {
    ...data,
    id: `user-${Date.now()}`,
    email: data.email.trim().toLowerCase(),
    addresses: [],
  }
  saveSession({ user, password })
  return user
}

export const updateCurrentUser = (updater: (user: AuthUser) => AuthUser) => {
  const session = getAuthSession()
  if (!session) return null
  const nextSession = { ...session, user: updater(session.user) }
  saveSession(nextSession)
  return nextSession.user
}

export const changeDemoPassword = (currentPassword: string, newPassword: string) => {
  const session = getAuthSession()
  if (!session || session.password !== currentPassword) return false
  saveSession({ ...session, password: newPassword })
  return true
}

export const logoutDemo = () => saveSession(null)

export const getUserInitial = (user: AuthUser) => {
  const source = `${user.lastName} ${user.firstName}`.trim() || user.email
  return source.charAt(0).toLocaleUpperCase('vi')
}

export const getUserDisplayName = (user: AuthUser) => `${user.lastName} ${user.firstName}`.trim() || 'Khách hàng'
