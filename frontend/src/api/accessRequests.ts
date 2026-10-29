
import api from './axios'
import type { SiteAccessRequest } from '../types/accessRequest'

export const getMyJoinRequests = async () => {
  const response = await api.get<SiteAccessRequest[]>(
    '/my-join-requests/',
  )
  return response.data
}

export const requestSiteAccess = async (siteId: string) => {
  const response = await api.post<SiteAccessRequest>(
    '/my-join-requests/',
    { site_id: siteId },
  )
  return response.data
}

export const getIncomingRequests = async () => {
  const response = await api.get<SiteAccessRequest[]>(
    '/incoming-access-requests/',
  )
  return response.data
}

export const decideAccessRequest = async (
  requestId: string,
  action: 'accept' | 'reject',
) => {
  const response = await api.post<SiteAccessRequest>(
    `/access-requests/${requestId}/decide/`,
    { action },
  )
  return response.data
}
