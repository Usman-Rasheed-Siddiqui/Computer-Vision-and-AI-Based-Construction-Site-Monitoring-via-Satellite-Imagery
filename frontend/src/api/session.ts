import axios from 'axios'
import { clearSiteCache } from './siteCache'

/** Session ends after this long without user activity (NFR: 1 hour). */
export const SESSION_IDLE_LIMIT_MS = 60 * 60 * 1000

const ACCESS = 'access_token'
const REFRESH = 'refresh_token'
const USERNAME = 'user_username'
const LAST_ACTIVITY = 'last_activity'
export const SESSION_EXPIRED_FLAG = 'session_expired'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

export const touchActivity = (): void => {
  localStorage.setItem(LAST_ACTIVITY, String(Date.now()))
}

export const getLastActivity = (): number => Number(localStorage.getItem(LAST_ACTIVITY)) || 0

export const clearSession = (): void => {
  localStorage.removeItem(ACCESS)
  localStorage.removeItem(REFRESH)
  localStorage.removeItem(USERNAME)
  localStorage.removeItem(LAST_ACTIVITY)
  clearSiteCache()
}

/**
 * True while a valid, non-idle session exists. If the user has been inactive
 * for longer than the limit, the session is cleared and a flag is set so the
 * sign-in page can explain why.
 */
export const checkSession = (): boolean => {
  if (!localStorage.getItem(ACCESS)) return false

  const last = getLastActivity()
  if (!last) {
    // Session created before idle tracking existed: start counting now.
    touchActivity()
    return true
  }

  if (Date.now() - last > SESSION_IDLE_LIMIT_MS) {
    clearSession()
    sessionStorage.setItem(SESSION_EXPIRED_FLAG, '1')
    return false
  }
  return true
}

/** End the session immediately and send the user to the sign-in page. */
export const expireSession = (): void => {
  clearSession()
  sessionStorage.setItem(SESSION_EXPIRED_FLAG, '1')
  if (window.location.pathname !== '/signin') {
    window.location.href = '/signin'
  }
}

let refreshing: Promise<string> | null = null

/**
 * Exchange the refresh token for a new access token (and a rotated refresh
 * token). Uses plain axios, not the shared instance, so it can never loop
 * through the 401 interceptor. Concurrent callers share one request.
 */
export const refreshSession = (): Promise<string> => {
  if (refreshing) return refreshing

  const refresh = localStorage.getItem(REFRESH)
  if (!refresh) return Promise.reject(new Error('No refresh token'))

  refreshing = axios
    .post<{ access: string; refresh?: string }>(`${baseURL}/auth/refresh/`, { refresh })
    .then((res) => {
      localStorage.setItem(ACCESS, res.data.access)
      if (res.data.refresh) localStorage.setItem(REFRESH, res.data.refresh)
      return res.data.access
    })
    .finally(() => {
      refreshing = null
    })

  return refreshing
}