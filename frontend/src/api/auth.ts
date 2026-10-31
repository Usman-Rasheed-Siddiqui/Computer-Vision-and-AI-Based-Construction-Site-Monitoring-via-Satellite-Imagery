import api from './axios'

export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  first_name: string
  last_name: string
}

export interface TokenResponse {
  access: string
  refresh: string
}

export interface RegisterResponse {
  id?: number | string
  username?: string
  email?: string
  detail?: string
}

export const login = async (
  payload: LoginPayload,
): Promise<TokenResponse> => {
  const response = await api.post<TokenResponse>(
    '/auth/login/',
    payload,
  )

  localStorage.setItem('access_token', response.data.access)
  localStorage.setItem('refresh_token', response.data.refresh)
  localStorage.setItem('user_username', payload.username)

  return response.data
}

export const register = async (
  payload: RegisterPayload,
): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>(
    '/auth/register/',
    payload,
  )

  return response.data
}

export const refreshAccessToken = async (): Promise<TokenResponse> => {
  const refresh = localStorage.getItem('refresh_token')

  if (!refresh) {
    throw new Error('No refresh token found. Please log in again.')
  }

  const response = await api.post<{ access: string }>(
    '/auth/refresh/',
    { refresh },
  )

  localStorage.setItem('access_token', response.data.access)

  return {
    access: response.data.access,
    refresh,
  }
}

export const logout = (): void => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user_username')
}

export const isAuthenticated = (): boolean => {
  return Boolean(localStorage.getItem('access_token'))
}
