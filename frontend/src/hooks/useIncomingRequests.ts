
import { useCallback, useEffect, useState } from 'react'
import { getIncomingRequests } from '../api/accessRequests'
import type { SiteAccessRequest } from '../types/accessRequest'

export function useIncomingRequests() {
  const [requests, setRequests] = useState<SiteAccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      setRequests(await getIncomingRequests())
    } catch {
      setError('Could not load incoming access requests.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { requests, loading, error, refresh }
}
