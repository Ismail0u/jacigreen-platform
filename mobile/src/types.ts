export interface Mission {
  id: string
  name: string
  description?: string | null
  status: string
  mission_date?: string | null
  notes?: string | null
  created_at: string
  completed_at?: string | null
}

export interface StoredPhoto {
  id: number
  mission_id: string
  filename: string
  uri: string
  latitude: number
  longitude: number
  altitude_m?: number | null
  created_at: string
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
}
