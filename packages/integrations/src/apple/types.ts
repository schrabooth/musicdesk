// Apple Music specific types

export interface AppleMusicCredentials {
  email: string
  password: string
  twilioSid?: string
  twilioToken?: string
  phoneNumber?: string
}

export interface AppleMusicArtistData {
  amiIdentity: string
  name: string
  image?: string
  appleMusicId?: string
  appleMusicUrl?: string
  shazams?: number
  verified: boolean
}

export interface AppleMusicAnalytics {
  plays: number
  listeners?: number
  shazams?: number
  date: string
  territory?: string
  demographic?: {
    age: Record<string, number>
    gender: Record<string, number>
  }
}

export interface AppleMusicTimeSeriesData {
  targets: Array<{
    targetId: string
    targetType: 'artist' | 'song' | 'album'
    feature: 'plays' | 'listeners' | 'shazams'
    artistId: string
    territory?: string
  }>
  period: 'ltd' | 'last-30-days' | 'last-7-days'
  granularity: 'd' | 'w' | 'm'
  from: string
  to: string
}

export interface AppleMusicAPIResponse {
  results: Array<{
    target: {
      targetId: string
      targetType: string
      feature: string
    }
    territory?: string
    data: Array<{
      date: string
      value: number
    }>
    totals?: {
      value: number
    }
  }>
}

export interface AppleMusicRosterResponse {
  managedArtists: Array<{
    artistId: string
    artistName: string
    artwork?: {
      url: string
      width: number
      height: number
    }
    appleMusicUrl?: string
  }>
  pendingArtists: Array<{
    artistId: string
    artistName: string
    inviteStatus: 'pending' | 'accepted' | 'declined'
  }>
}