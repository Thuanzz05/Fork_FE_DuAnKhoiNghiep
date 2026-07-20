const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
const ACCESS_TOKEN_KEY = 'rubeanora-access-token'

type ApiEnvelope<T> = {
  success: boolean
  data?: T
  message?: string
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const getAccessToken = () => sessionStorage.getItem(ACCESS_TOKEN_KEY)

export const setAccessToken = (token: string | null) => {
  if (token) sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
  else sessionStorage.removeItem(ACCESS_TOKEN_KEY)
}

export const resolveApiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path
  const apiPath = path.replace(/^\/?api\//i, '/')
  return `${API_BASE_URL}${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken()
  const headers = new Headers(options.headers)
  if (typeof options.body === 'string' && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      ...options,
      headers,
    })
  } catch {
    throw new ApiError('Không thể kết nối máy chủ. Vui lòng kiểm tra backend đang chạy.', 0)
  }

  const payload = await response.json().catch(() => ({})) as ApiEnvelope<T>
  if (!response.ok || payload.success === false) {
    if (response.status === 401) {
      setAccessToken(null)
      sessionStorage.removeItem('red-bean-beauty-auth-session')
      window.dispatchEvent(new CustomEvent('auth-updated', { detail: null }))
    }
    throw new ApiError(payload.message || `Yêu cầu thất bại (${response.status})`, response.status)
  }
  return payload.data as T
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, {
    method: 'POST', body: body === undefined ? undefined : JSON.stringify(body),
  }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, {
    method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body),
  }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, {
    method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body),
  }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
}
