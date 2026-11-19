import api from './axios'
import { checkSession, clearSession, refreshSession, touchActivity } from './session'

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
  touchActivity()

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
  const access = await refreshSession()
  return { access, refresh: localStorage.getItem('refresh_token') ?? '' }
}

export const logout = (): void => {
  clearSession()
}

export const isAuthenticated = (): boolean => checkSession()