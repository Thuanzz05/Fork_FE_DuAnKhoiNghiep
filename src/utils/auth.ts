import { api, setAccessToken } from '../services/api'

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
  role?: 'ADMIN' | 'KHACH_HANG'
  addresses: CustomerAddress[]
}

type AuthSession = {
  user: AuthUser
  password: string
}

type UserResponse = {
  user: AuthUser
}

type PasswordResetRequestResponse = {
  message: string
  resetUrl?: string
}

const AUTH_SESSION_KEY = 'red-bean-beauty-auth-session'
const AUTH_USERS_KEY = 'red-bean-beauty-auth-users'

const dispatchAuthUpdated = (session: AuthSession | null) => {
  window.dispatchEvent(new CustomEvent<AuthSession | null>('auth-updated', { detail: session }))
}

export const getAuthSession = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as AuthSession & { user: AuthUser & { user?: AuthUser } }
    // Recover sessions saved by older clients that stored the API's { user } wrapper.
    if (session.user?.user) return { ...session, user: session.user.user }
    return session
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

export const loginDemo = async (email: string, password: string) => {
  const result = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password })
  setAccessToken(result.token)
  saveSession({ user: result.user, password: '' })
  return result.user
}

export const registerDemo = async (data: Omit<AuthUser, 'id' | 'addresses' | 'role'>, password: string) => {
  const result = await api.post<{ token: string; user: AuthUser }>('/auth/register', { ...data, password })
  setAccessToken(result.token)
  saveSession({ user: result.user, password: '' })
  return result.user
}

export const loginWithGoogle = async (credential: string) => {
  const result = await api.post<{ token: string; user: AuthUser }>('/auth/google', { credential })
  setAccessToken(result.token)
  saveSession({ user: result.user, password: '' })
  return result.user
}

export const requestPasswordReset = async (email: string) => {
  return api.post<PasswordResetRequestResponse>('/auth/forgot-password', { email })
}

export const resetForgottenPassword = async (token: string, newPassword: string) => {
  return api.post<{ message: string }>('/auth/reset-password', { token, newPassword })
}

export const updateCurrentUser = (updater: (user: AuthUser) => AuthUser) => {
  const session = getAuthSession()
  if (!session) return null
  const nextSession = { ...session, user: updater(session.user) }
  saveSession(nextSession)
  return nextSession.user
}

export const changeDemoPassword = async (currentPassword: string, newPassword: string) => {
  await api.put('/customers/me/password', { currentPassword, newPassword })
  return true
}

export const updateProfile = async (input: Pick<AuthUser, 'firstName' | 'lastName' | 'email' | 'phone'> & { avatar?: string }) => {
  const { user } = await api.put<UserResponse>('/customers/me', input)
  const session = getAuthSession()
  saveSession({ user, password: session?.password ?? '' })
  return user
}

export const addUserAddress = async (input: Omit<CustomerAddress, 'id'>) => {
  const { user } = await api.post<UserResponse>('/customers/me/addresses', input)
  const session = getAuthSession()
  saveSession({ user, password: session?.password ?? '' })
  return user
}

export const makeUserAddressDefault = async (addressId: string) => {
  const { user } = await api.patch<UserResponse>(`/customers/me/addresses/${addressId}/default`)
  const session = getAuthSession()
  saveSession({ user, password: session?.password ?? '' })
  return user
}

export const removeUserAddress = async (addressId: string) => {
  const { user } = await api.delete<UserResponse>(`/customers/me/addresses/${addressId}`)
  const session = getAuthSession()
  saveSession({ user, password: session?.password ?? '' })
  return user
}

export const logoutDemo = () => {
  setAccessToken(null)
  saveSession(null)
}

export const getUserInitial = (user: AuthUser) => {
  const source = `${user.lastName} ${user.firstName}`.trim() || user.email
  return source.charAt(0).toLocaleUpperCase('vi')
}

export const getUserDisplayName = (user: AuthUser) => `${user.lastName} ${user.firstName}`.trim() || 'Khách hàng'
