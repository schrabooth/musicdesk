import SpotifyWebApi from 'spotify-web-api-node'
import { PlatformIntegration, AuthResult, Artist, Track, Analytics, AnalyticsOptions, PlatformCredentials } from '../types'

export class SpotifyIntegration implements PlatformIntegration {
  name = 'spotify'
  type = 'oauth' as const

  private client: SpotifyWebApi
  private clientCredentialsClient: SpotifyWebApi

  constructor(clientId: string, clientSecret: string, redirectUri?: string) {
    // OAuth client for user authentication
    this.client = new SpotifyWebApi({
      clientId,
      clientSecret,
      redirectUri,
    })

    // Client credentials for app-level authentication
    this.clientCredentialsClient = new SpotifyWebApi({
      clientId,
      clientSecret,
    })
  }

  /**
   * Authenticate using OAuth 2.0 Authorization Code flow
   */
  async authenticate(credentials: PlatformCredentials): Promise<AuthResult> {
    try {
      if (credentials.code) {
        // Exchange authorization code for tokens
        const data = await this.client.authorizationCodeGrant(credentials.code)
        
        const accessToken = data.body.access_token
        const refreshToken = data.body.refresh_token
        const expiresIn = data.body.expires_in

        return {
          success: true,
          accessToken,
          refreshToken,
          expiresAt: new Date(Date.now() + expiresIn * 1000),
        }
      } else {
        // Generate authorization URL
        const scopes = [
          'user-read-private',
          'user-read-email',
          'user-library-read',
          'user-follow-read',
          'user-top-read',
          'playlist-read-private',
          'user-read-recently-played',
        ]
        
        const authorizeURL = this.client.createAuthorizeURL(scopes, 'state')
        
        return {
          success: false,
          error: `Please visit: ${authorizeURL}`,
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Authentication failed',
      }
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAuth(refreshToken: string): Promise<AuthResult> {
    try {
      this.client.setRefreshToken(refreshToken)
      const data = await this.client.refreshAccessToken()
      
      const accessToken = data.body.access_token
      const newRefreshToken = data.body.refresh_token || refreshToken
      const expiresIn = data.body.expires_in

      return {
        success: true,
        accessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Token refresh failed',
      }
    }
  }

  /**
   * Get client credentials token for app-level requests
   */
  async getClientCredentialsToken(): Promise<string | null> {
    try {
      const data = await this.clientCredentialsClient.clientCredentialsGrant()
      const accessToken = data.body.access_token
      this.clientCredentialsClient.setAccessToken(accessToken)
      return accessToken
    } catch (error) {
      console.error('Failed to get client credentials token:', error)
      return null
    }
  }

  /**
   * Get user's followed artists
   */
  async getArtists(auth: AuthResult): Promise<Artist[]> {
    try {
      if (!auth.accessToken) {
        throw new Error('No access token provided')
      }

      this.client.setAccessToken(auth.accessToken)
      
      const data = await this.client.getFollowedArtists({ limit: 50 })
      
      return data.body.artists.items.map(artist => ({
        id: artist.id,
        name: artist.name,
        image: artist.images?.[0]?.url,
        genres: artist.genres,
        followers: artist.followers.total,
        verified: artist.followers.total > 1000000, // Simple heuristic
        externalUrls: artist.external_urls,
      }))
    } catch (error: any) {
      console.error('Error fetching artists:', error)
      return []
    }
  }

  /**
   * Get specific artist by ID
   */
  async getArtist(id: string, auth: AuthResult): Promise<Artist | null> {
    try {
      // Try with user token first, fallback to client credentials
      let client = this.client
      if (auth.accessToken) {
        client.setAccessToken(auth.accessToken)
      } else {
        const token = await this.getClientCredentialsToken()
        if (!token) return null
        client = this.clientCredentialsClient
      }

      const data = await client.getArtist(id)
      const artist = data.body

      return {
        id: artist.id,
        name: artist.name,
        image: artist.images?.[0]?.url,
        genres: artist.genres,
        followers: artist.followers.total,
        verified: artist.followers.total > 1000000,
        externalUrls: artist.external_urls,
      }
    } catch (error: any) {
      console.error('Error fetching artist:', error)
      return null
    }
  }

  /**
   * Search for artists
   */
  async searchArtists(query: string, auth: AuthResult): Promise<Artist[]> {
    try {
      const token = auth.accessToken || await this.getClientCredentialsToken()
      if (!token) return []

      const client = auth.accessToken ? this.client : this.clientCredentialsClient
      if (auth.accessToken) {
        client.setAccessToken(auth.accessToken)
      }

      const data = await client.searchArtists(query, { limit: 20 })
      
      return data.body.artists?.items.map(artist => ({
        id: artist.id,
        name: artist.name,
        image: artist.images?.[0]?.url,
        genres: artist.genres,
        followers: artist.followers.total,
        verified: artist.followers.total > 1000000,
        externalUrls: artist.external_urls,
      })) || []
    } catch (error: any) {
      console.error('Error searching artists:', error)
      return []
    }
  }

  /**
   * Get artist's top tracks
   */
  async getTracks(artistId: string, auth: AuthResult): Promise<Track[]> {
    try {
      const token = auth.accessToken || await this.getClientCredentialsToken()
      if (!token) return []

      const client = auth.accessToken ? this.client : this.clientCredentialsClient
      if (auth.accessToken) {
        client.setAccessToken(auth.accessToken)
      }

      const data = await client.getArtistTopTracks(artistId, 'US')
      
      return data.body.tracks.map(track => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map(artist => ({
          id: artist.id,
          name: artist.name,
          externalUrls: artist.external_urls,
        })),
        duration: track.duration_ms,
        popularity: track.popularity,
        externalUrls: track.external_urls,
      }))
    } catch (error: any) {
      console.error('Error fetching tracks:', error)
      return []
    }
  }

  /**
   * Get analytics data (limited to what's available via Web API)
   */
  async getAnalytics(artistId: string, auth: AuthResult, options?: AnalyticsOptions): Promise<Analytics[]> {
    try {
      const artist = await this.getArtist(artistId, auth)
      if (!artist) return []

      // Spotify Web API doesn't provide time-series analytics
      // This would need Spotify for Artists API integration
      return [{
        date: new Date().toISOString().split('T')[0],
        followers: artist.followers || 0,
      }]
    } catch (error: any) {
      console.error('Error fetching analytics:', error)
      return []
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-library-read',
      'user-follow-read',
      'user-top-read',
      'playlist-read-private',
      'user-read-recently-played',
    ]
    
    return this.client.createAuthorizeURL(scopes, state || 'musicdesk')
  }
}