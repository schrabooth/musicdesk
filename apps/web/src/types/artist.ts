export interface Artist {
  id: string
  name: string
  slug: string
  verified: boolean
  avatar?: string | null
  bio?: string | null
  genres: string[]
  spotifyId?: string | null
  appleMusicId?: string | null
  amiIdentity?: string | null
  createdAt: string
  updatedAt: string
  _count: {
    tracks: number
    releases: number
    royalties: number
  }
}

export interface ArtistWithDetails extends Artist {
  platforms: Platform[]
  tracks: Track[]
  releases: Release[]
  analytics: Analytics[]
  unclaimedRoyalties: UnclaimedRoyalty[]
}

export interface Platform {
  id: string
  type: 'SPOTIFY' | 'APPLE_MUSIC' | 'DISTROKID'
  status: 'PENDING' | 'SYNCED' | 'ERROR'
  lastSync?: string
}

export interface Track {
  id: string
  title: string
  isrc?: string
  duration?: number
  trackNumber?: number
  spotifyId?: string
  appleMusicId?: string
}

export interface Release {
  id: string
  title: string
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'DISTRIBUTED' | 'LIVE'
  releaseDate?: string
  upc?: string
  releaseType: 'SINGLE' | 'EP' | 'ALBUM'
  coverArt?: string
}

export interface Analytics {
  date: string
  streams: number
  listeners: number
  followers: number
  saves: number
  source: 'SPOTIFY' | 'APPLE_MUSIC'
  territory?: string
}

export interface UnclaimedRoyalty {
  id: string
  amount: number
  source: string
  type: 'MECHANICAL' | 'PERFORMANCE' | 'SYNCHRONIZATION'
  period: string
  territory?: string
  track?: {
    id: string
    title: string
    isrc?: string
  }
}