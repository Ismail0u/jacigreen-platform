/**
 * interface MissionInfo defines the structure of a mission object, including properties such as id, name, description, status, mission date, zone id, operator id, notes, created at timestamp, and completed at timestamp. This interface is used to represent the details of a mission within the application.
 * interface MissionPhotoSelection defines the structure of a mission photo selection object, including properties such as id, filename, storage URL, altitude in meters, latitude, and longitude. This interface is used to represent the details of a photo associated with a mission within the application.
 * missionReport defines the structure of a mission report object, including properties such as mission name, status, photo count, detection count, high confidence count, medium confidence count, low confidence count, and a summary object containing confidence and coverage information. This interface is used to represent the results and analysis of a mission within the application.
 * missionReport is useful for providing users with a clear understanding of the outcomes and performance of a mission, allowing them to assess the effectiveness of their operations and make informed decisions based on the data collected during the mission.
 * missions are essential for tracking and managing various tasks and objectives within the application, enabling users to organize their work, monitor progress, and evaluate results in a structured manner. The interfaces defined here facilitate the representation and manipulation of mission-related data, ensuring consistency and clarity throughout the application.
 */

export interface MissionInfo {
  id: string
  name: string
  description?: string
  status: string
  mission_date?: string
  zone_id?: string
  operator_id?: string
  notes?: string
  created_at: string
  completed_at?: string
}

export interface MissionPhotoSelection {
  id: string
  filename: string
  storage_url?: string
  altitude_m?: number | null
  latitude?: number
  longitude?: number
}

export interface MissionReport {
  mission_name: string
  status: string
  photo_count: number
  detection_count: number
  high_confidence_count: number
  medium_confidence_count: number
  low_confidence_count: number
  summary: {
    confidence: string
    coverage: string
  }
}
