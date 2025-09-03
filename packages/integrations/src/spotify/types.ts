// Spotify-specific types extending the base types

export interface SpotifyCredentials {
  code?: string // For OAuth flow
  clientId: string
  clientSecret: string
  redirectUri?: string
}

export interface SpotifyArtistData {
  spotifyId: string
  name: string
  image?: string
  genres: string[]
  followers: number
  monthlyListeners?: number
  popularity: number
  externalUrls: {
    spotify: string
  }
}

export interface SpotifyTrackData {
  spotifyId: string
  name: string
  artists: SpotifyArtistData[]
  album: {
    id: string
    name: string
    images: Array<{ url: string }>
    releaseDate: string
  }
  duration: number
  popularity: number
  isrc?: string
  playCount?: number
  externalUrls: {
    spotify: string
  }
}

export interface SpotifyAnalytics {
  streams: number
  listeners: number
  followers: number
  saves: number
  date: string
  territory?: string
  demographic?: {
    age: Record<string, number>
    gender: Record<string, number>
  }
}

// Spotify for Artists API types (for advanced analytics)
export interface SpotifyForArtistsData {
  artistId: string
  timeframe: {
    start: string
    end: string
  }
  streams: Array<{
    date: string
    value: number
    territory?: string
  }>
  listeners: Array<{
    date: string
    value: number
    territory?: string
  }>
  demographics: {
    age: Record<string, number>
    gender: Record<string, number>
  }
  topTracks: Array<{
    trackId: string
    name: string
    streams: number
    listeners: number
  }>
  playlists: Array<{
    playlistId: string
    name: string
    followers: number
    streams: number
  }>
}