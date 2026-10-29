
export interface SiteAccessRequest {
  request_id: string
  site_id: string | null
  site_name: string | null
  requester_email: string | null
  request_from: string | null
  request_to: string | null
  construction: string | null
  status: 'pending' | 'accepted' | 'rejected' | null
  created_at: string | null
}
