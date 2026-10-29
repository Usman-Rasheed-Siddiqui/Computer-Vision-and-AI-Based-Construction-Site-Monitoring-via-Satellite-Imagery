
import api from './axios'
import type {
  ConstructionSite,
  CreateSitePayload,
  ProgressLog,
} from '../types/site'

export const getSites = async () => {
  const response = await api.get<ConstructionSite[]>('/sites/')
  return response.data
}

export const createSite = async (payload: CreateSitePayload) => {
  const response = await api.post<ConstructionSite>('/sites/', payload)
  return response.data
}

export const getSite = async (siteId: string) => {
  const response = await api.get<ConstructionSite>(`/sites/${siteId}/`)
  return response.data
}

export const getSiteProgress = async (siteId: string) => {
  const response = await api.get<ProgressLog[]>(
    `/sites/${siteId}/progress/`,
  )
  return response.data
}
