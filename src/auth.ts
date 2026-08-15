export type Profile = {
  id: number
  email: string
  displayName: string
  bio: string
  createdAt: string
  updatedAt: string
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled' | 'refunded'

export type OrderHistory = {
  stats: {
    totalOrders: number
    totalItems: number
    totalSpentKopecks: number
  }
  orders: Array<{
    reference: string
    status: OrderStatus
    totalKopecks: number
    itemCount: number
    createdAt: string
    updatedAt: string
    items: Array<{
      title: string
      unitPriceKopecks: number
      quantity: number
    }>
  }>
}

type ProfileResponse = { profile: Profile }
type ErrorResponse = { error?: { code?: string; message?: string } }

const API_BASE = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8787' : '')).replace(/\/$/, '')

export class AuthApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'AuthApiError'
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })
  const text = await response.text()
  const body = text ? JSON.parse(text) as T & ErrorResponse : null
  if (!response.ok) {
    throw new AuthApiError(
      response.status,
      body?.error?.code || 'REQUEST_FAILED',
      body?.error?.message || 'Не удалось выполнить запрос',
    )
  }
  return body as T
}

export async function readProfile(signal?: AbortSignal): Promise<Profile | null> {
  try {
    const result = await request<ProfileResponse>('/api/profile', { signal })
    return result.profile
  } catch (error) {
    if (error instanceof AuthApiError && error.status === 401) return null
    throw error
  }
}

export async function readOrderHistory(signal?: AbortSignal) {
  return request<OrderHistory>('/api/profile/orders', { signal })
}

export async function login(email: string, password: string) {
  return (await request<ProfileResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })).profile
}

export async function register(email: string, password: string, displayName: string) {
  return (await request<ProfileResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  })).profile
}

export async function updateProfile(displayName: string) {
  return (await request<ProfileResponse>('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify({ displayName }),
  })).profile
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return (await request<ProfileResponse>('/api/profile/password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })).profile
}

export async function logout() {
  await request<null>('/api/auth/logout', { method: 'POST' })
}

export async function logoutEverywhere() {
  await request<null>('/api/auth/logout-all', { method: 'POST' })
}
