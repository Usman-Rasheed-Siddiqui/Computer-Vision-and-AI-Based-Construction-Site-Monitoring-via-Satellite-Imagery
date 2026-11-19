import api from './axios'

/**
 * Small client-side cache for single-site data (site details + progress logs).
 *
 * Pages read from it synchronously so they can paint immediately with the
 * last known data, then refresh in the background. Requests for the same
 * resource are de-duplicated, so a prefetch started on hover is reused when
 * the page mounts. Entries are kept in memory and in sessionStorage, so a
 * page reload in the same tab is also instant.
 */

const STORAGE_PREFIX = 'site-cache:'

type Entry = { data: unknown; savedAt: number }

const memory = new Map<string, Entry>()
const inFlight = new Map<string, Promise<unknown>>()

const siteKey = (id: string) => `site:${id}`
const progressKey = (id: string) => `progress:${id}`

function read<T>(key: string): T | undefined {
  const hit = memory.get(key)
  if (hit) return hit.data as T

  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key)
    if (!raw) return undefined
    const entry = JSON.parse(raw) as Entry
    memory.set(key, entry)
    return entry.data as T
  } catch {
    return undefined
  }
}

function write(key: string, data: unknown) {
  const entry: Entry = { data, savedAt: Date.now() }
  memory.set(key, entry)
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry))
  } catch {
    /* storage full or blocked: the in-memory copy is enough */
  }
}

function load<T>(key: string, url: string, normalize: (raw: unknown) => T): Promise<T> {
  const pending = inFlight.get(key)
  if (pending) return pending as Promise<T>

  const request = api
    .get(url)
    .then((response) => {
      const data = normalize(response.data)
      write(key, data)
      return data
    })
    .finally(() => inFlight.delete(key))

  inFlight.set(key, request)
  return request
}

const normalizeLogs = (raw: unknown): unknown[] => {
  const logs = (raw as { progress_logs?: unknown } | null)?.progress_logs ?? raw
  return Array.isArray(logs) ? logs : []
}

// ---- Site details --------------------------------------------------------

export const getCachedSite = <T = unknown>(id: string) => read<T>(siteKey(id))

export const fetchSite = <T = unknown>(id: string) =>
  load<T>(siteKey(id), `sites/${id}/`, (raw) => raw as T)

/** Updates the cached copy after a local edit (merges into what is there). */
export const updateCachedSite = (id: string, patch: Record<string, unknown>) => {
  const current = read<Record<string, unknown>>(siteKey(id))
  if (current) write(siteKey(id), { ...current, ...patch })
}

/**
 * Seeds the cache from the sites list, so opening a site paints at once.
 * A full detail response already cached is never overwritten.
 */
export const seedSitesFromList = (
  sites: { construction_id?: string }[],
  isOwner: boolean,
) => {
  for (const site of sites) {
    if (!site?.construction_id) continue
    const key = siteKey(site.construction_id)
    if (read(key)) continue
    write(key, { ...site, is_owner: isOwner })
  }
}

// ---- Progress logs -------------------------------------------------------

export const getCachedProgress = <T = unknown>(id: string) => read<T[]>(progressKey(id))

export const fetchProgress = <T = unknown>(id: string) =>
  load<T[]>(progressKey(id), `sites/${id}/progress/`, normalizeLogs as (raw: unknown) => T[])

// ---- Prefetch & cleanup --------------------------------------------------

/** Starts loading a site's data ahead of navigation (e.g. on hover). */
export const prefetchSite = (id: string) => {
  void fetchSite(id).catch(() => undefined)
  void fetchProgress(id).catch(() => undefined)
}

/** Removes every cached site, e.g. on sign-out so another user sees nothing. */
export const clearSiteCache = () => {
  memory.clear()
  inFlight.clear()
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(STORAGE_PREFIX)) sessionStorage.removeItem(key)
    }
  } catch {
    /* ignore */
  }
}
