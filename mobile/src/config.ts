import { Platform } from 'react-native'

// A physical phone must use the LAN address of the computer running FastAPI.
const localApiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000'

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || localApiUrl).replace(/\/$/, '')
