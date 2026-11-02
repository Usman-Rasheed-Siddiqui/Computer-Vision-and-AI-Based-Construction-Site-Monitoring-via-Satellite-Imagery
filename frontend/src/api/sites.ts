
import api from './axios'
import type {
  ConstructionSite,
  CreateSitePayload,
  ProgressLog,
  SatellitePreviewResponse,
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

// --- NEW FUNCTIONS FOR SATELLITE PREVIEW WORKFLOW ---

export const previewSatelliteImage = async (payload: {
  latitude: number
  longitude: number
  extent_meters: number
}) => {
  const response = await api.post<SatellitePreviewResponse>('/sites/preview-satellite/', payload)
  return response.data
}

export const confirmSiteRegistration = async (payload: CreateSitePayload & { temp_image_path?: string }) => {
  const response = await api.post<{ message: string; site_id: string }>('/sites/confirm-register/', payload)
  return response.data
}

export const discardSatellitePreview = async (filePath: string) => {
  const response = await api.delete('/sites/discard-preview/', {
    params: { file_path: filePath },
  })
  return response.data
}