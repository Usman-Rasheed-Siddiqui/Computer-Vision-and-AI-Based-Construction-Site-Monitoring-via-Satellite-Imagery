
import { useCallback, useEffect, useState } from 'react'
import { getSites } from '../api/sites'
import type { ConstructionSite } from '../types/site'

export function useSites() {
  const [sites, setSites] = useState<ConstructionSite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      setSites(await getSites())
    } catch {
      setError('Could not load construction sites.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { sites, loading, error, refresh }
}
