// API-specific types

export interface AuthCredentials {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface PlatformAuthRequest {
  email: string
  password: string
  artistId: string
  phoneNumber?: string
}

export interface SpotifyAuthResponse {
  authUrl: string
  state: string
}

export interface FileUploadRequest {
  file: File
  type: 'audio' | 'artwork'
  artistId: string
  releaseId?: string
}

export interface FileUploadResponse {
  fileName: string
  originalName: string
  fileSize: number
  fileType: string
  url: string
  type: 'audio' | 'artwork'
  uploadedAt: string
}

export interface CreateReleaseRequest {
  title: string
  artistId: string
  releaseType: 'SINGLE' | 'EP' | 'ALBUM'
  releaseDate?: string
  label?: string
  copyright?: string
  genre?: string
  coverArt?: string
  tracks?: Array<{
    title: string
    duration?: number
    explicit?: boolean
    audioUrl?: string
  }>
}

export interface DistributionRequest {
  stores: string[]
  provider: 'NUEMETA' | 'CD_BABY' | 'DISTROKID'
}

export interface AdminStatsResponse {
  overview: {
    totalUsers: number
    verifiedUsers: number
    totalArtists: number
    verifiedArtists: number
    totalReleases: number
    totalRoyalties: number
    unclaimedValue: number
  }
  users: {
    total: number
    verified: number
    admins: number
    thisMonth: number
  }
  artists: {
    total: number
    verified: number
    withSpotify: number
    withAppleMusic: number
  }
  releases: {
    byStatus: Record<string, number>
    total: number
    thisMonth: number
  }
  royalties: {
    totalUnclaimed: number
    unclaimedCount: number
    totalRoyalties: number
    totalValue: { _sum: { amount: number | null } }
  }
  platforms: Record<string, Record<string, number>>
  recentActivity: {
    users: Array<{
      id: string
      name: string
      email: string
      createdAt: string
    }>
    artists: Array<{
      id: string
      name: string
      verified: boolean
      createdAt: string
    }>
    releases: Array<{
      id: string
      title: string
      status: string
      createdAt: string
      artist: { name: string }
    }>
  }
  queues: Record<string, {
    waiting: number
    active: number
    completed: number
    failed: number
  }>
}