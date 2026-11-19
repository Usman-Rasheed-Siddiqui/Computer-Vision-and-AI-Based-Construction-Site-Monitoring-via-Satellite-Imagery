import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  checkSession,
  getLastActivity,
  refreshSession,
  touchActivity,
  expireSession,
} from '../api/session'

const EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const
const CHECK_EVERY_MS = 30 * 1000
const HEARTBEAT_EVERY_MS = 5 * 60 * 1000
const ACTIVITY_WRITE_THROTTLE_MS = 5 * 1000

/**
 * Ends the session after 1 hour without user activity.
 * - Records mouse/keyboard/touch/scroll activity (shared across tabs).
 * - Checks the idle time every 30 s and when the tab becomes visible again.
 * - While the user is active, quietly renews the login every 5 minutes so the
 *   server-side token stays valid exactly as long as the user is active.
 */
export default function useIdleLogout(): void {
  const navigate = useNavigate()

  useEffect(() => {
    let lastWrite = 0

    const onActivity = () => {
      const now = Date.now()
      if (now - lastWrite > ACTIVITY_WRITE_THROTTLE_MS) {
        lastWrite = now
        touchActivity()
      }
    }

    const verify = () => {
      if (!checkSession()) navigate('/signin', { replace: true })
    }

    const heartbeat = () => {
      if (Date.now() - getLastActivity() < HEARTBEAT_EVERY_MS) {
        refreshSession().catch((err) => {
          if (err?.response?.status === 401) expireSession()
        })
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') verify()
    }

    EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))
    document.addEventListener('visibilitychange', onVisible)
    const checkTimer = window.setInterval(verify, CHECK_EVERY_MS)
    const heartbeatTimer = window.setInterval(heartbeat, HEARTBEAT_EVERY_MS)

    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, onActivity))
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(checkTimer)
      window.clearInterval(heartbeatTimer)
    }
  }, [navigate])
}