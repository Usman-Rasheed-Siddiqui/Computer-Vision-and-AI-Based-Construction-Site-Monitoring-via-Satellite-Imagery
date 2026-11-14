
export interface ConstructionSite {
  construction_id: string
  site_name: string
  created_by: string | null
  location: string | null
  city: string | null
  country: string | null
  area: string | number | null
  start_date: string
  is_completed: boolean | null
  end_date: string | null
  is_public: boolean | null
  created_at: string | null
  current_progress: string | number | null
  center_coordinates: {
    latitude: number
    longitude: number
  } | null
  extent_meters: number | null
}

export interface CreateSitePayload {
  site_name: string
  start_date: string
  location?: string
  city?: string
  country?: string
  area?: number
  is_public?: boolean
  center_coordinates: {
    latitude: number
    longitude: number
  }
  extent_meters: number
}

export interface ProgressLog {
  progress_id: string
  construction: string | null
  baseline_image_filename: string | null
  latest_image_filename: string | null
  change_mask_filename: string | null
  area_changed_sqm: string | number | null
  change_percentage: string | number | null
  status: string
  satellite_image_date: string
  processed_at: string | null
}

export interface SatellitePreviewResponse {
  signed_url: string
  file_path: string
  target_date_used: string
  info: {
    release_date: string
    release_id: number
    zoom: number
    center_mpp: number
    size_px: [number, number]
    tiles_fetched: number
    missing_tiles: number
  }
}