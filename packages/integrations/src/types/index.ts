// Common types for platform integrations

export interface PlatformCredentials {
  [key: string]: any
}

export interface AuthResult {
  success: boolean
  accessToken?: string
  refreshToken?: string
  expiresAt?: Date
  cookies?: string
  error?: string
  requires2FA?: boolean
  sessionId?: string
}

export interface Artist {
  id: string
  name: string
  image?: string
  genres?: string[]
  followers?: number
  verified?: boolean
  externalUrls?: any
}

export interface Track {
  id: string
  name: string
  artists: Artist[]
  isrc?: string
  duration?: number
  popularity?: number
  playCount?: number
  externalUrls?: any
}

export interface Analytics {
  streams?: number
  listeners?: number
  followers?: number
  saves?: number
  date: string
  territory?: string
}

export interface RoyaltyData {
  title: string
  artist: string
  amount: number
  currency: string
  period: string
  source: string
  isrc?: string
  territory?: string
  status: 'claimed' | 'unclaimed' | 'pending'
}

// Platform-specific interfaces
export interface SpotifyArtist extends Artist {
  spotifyId: string
  monthlyListeners?: number
  topTracks?: Track[]
}

export interface AppleArtist extends Artist {
  amiIdentity: string
  appleMusicId?: string
  shazams?: number
}

export interface DistrokidAccount {
  email: string
  distrokidId: number
  artists: string[]
  earnings: RoyaltyData[]
}

// Base platform integration interface
export interface PlatformIntegration {
  name: string
  type: 'oauth' | 'scraping' | 'api'
  
  authenticate(credentials: PlatformCredentials): Promise<AuthResult>
  refreshAuth?(token: string): Promise<AuthResult>
  
  getArtists(auth: AuthResult): Promise<Artist[]>
  getArtist(id: string, auth: AuthResult): Promise<Artist | null>
  getAnalytics(artistId: string, auth: AuthResult, options?: AnalyticsOptions): Promise<Analytics[]>
  
  // Optional methods
  searchArtists?(query: string, auth: AuthResult): Promise<Artist[]>
  getTracks?(artistId: string, auth: AuthResult): Promise<Track[]>
  getRoyalties?(artistId: string, auth: AuthResult): Promise<RoyaltyData[]>
}

export interface AnalyticsOptions {
  startDate?: string
  endDate?: string
  territories?: string[]
  granularity?: 'day' | 'week' | 'month'
  metrics?: string[]
}