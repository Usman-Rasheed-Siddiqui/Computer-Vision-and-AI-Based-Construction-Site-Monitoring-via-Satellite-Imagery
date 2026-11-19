import axios from 'axios'
import { expireSession, refreshSession } from './session'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// When the short-lived access token expires, renew it once with the refresh
// token and retry the request. If renewal fails (the refresh token has also
// expired after 1 hour of inactivity), end the session and go to sign-in.
// Login/register/refresh calls are skipped so wrong passwords just show an error.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined
    const isAuthCall = original?.url?.includes('/auth/')

    if (error.response?.status === 401 && original && !isAuthCall) {
      if (!original._retry && localStorage.getItem('refresh_token')) {
        original._retry = true
        try {
          const access = await refreshSession()
          original.headers.Authorization = `Bearer ${access}`
          return api(original)
        } catch {
          /* fall through to expire the session */
        }
      }
      expireSession()
    }

    return Promise.reject(error)
  },
)

export default api