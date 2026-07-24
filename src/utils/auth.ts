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

const dispatchAuthUpdated = (session: AuthSession | null) => {
  window.dispatchEvent(new CustomEvent<AuthSession | null>('auth-updated', { detail: session }))
}

export const getAuthSession = (): AuthSession | null => {
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY) ?? localStorage.getItem(AUTH_SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as AuthSession & { user: AuthUser & { user?: AuthUser } }
    // Recover sessions saved by older clients that stored the API's { user } wrapper.
    if (session.user?.user) return { ...session, user: session.user.user }
    return session
  } catch {
    return null
  }
}

export const getCurrentUser = () => getAuthSession()?.user ?? null

const hasRememberedSession = () => localStorage.getItem(AUTH_SESSION_KEY) !== null

const saveSession = (session: AuthSession | null, remember = hasRememberedSession()) => {
  sessionStorage.removeItem(AUTH_SESSION_KEY)
  localStorage.removeItem(AUTH_SESSION_KEY)

  if (session) {
    const storage = remember ? localStorage : sessionStorage
    storage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
  }
  dispatchAuthUpdated(session)
}

export const loginDemo = async (email: string, password: string, remember = false) => {
  const result = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password, remember })
  setAccessToken(result.token, remember)
  saveSession({ user: result.user, password: '' }, remember)
  return result.user
}

export const registerDemo = async (data: Omit<AuthUser, 'id' | 'addresses' | 'role'>, password: string) => {
  const result = await api.post<{ token: string; user: AuthUser }>('/auth/register', { ...data, password })
  setAccessToken(result.token)
  saveSession({ user: result.user, password: '' })
  return result.user
}

export const loginWithGoogle = async (credential: string, remember = false) => {
  const result = await api.post<{ token: string; user: AuthUser }>('/auth/google', { credential, remember })
  setAccessToken(result.token, remember)
  saveSession({ user: result.user, password: '' }, remember)
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
