// Main entry point for all platform integrations

export * from './types'
export * from './spotify'
export * from './apple'
export * from './distrokid'

// Platform factory function
import { SpotifyIntegration } from './spotify'
import { AppleMusicIntegration } from './apple'
import { DistroKidIntegration } from './distrokid'
import { PlatformIntegration } from './types'

export type PlatformType = 'spotify' | 'apple' | 'distrokid'

export interface PlatformConfig {
  spotify?: {
    clientId: string
    clientSecret: string
    redirectUri?: string
  }
  apple?: {
    email: string
    password: string
    twilioSid?: string
    twilioToken?: string
  }
  distrokid?: {
    email: string
    password: string
  }
}

export class IntegrationFactory {
  private config: PlatformConfig

  constructor(config: PlatformConfig) {
    this.config = config
  }

  create(platform: PlatformType): PlatformIntegration | null {
    switch (platform) {
      case 'spotify':
        const spotifyConfig = this.config.spotify
        if (!spotifyConfig?.clientId || !spotifyConfig?.clientSecret) {
          throw new Error('Spotify configuration missing clientId or clientSecret')
        }
        return new SpotifyIntegration(
          spotifyConfig.clientId,
          spotifyConfig.clientSecret,
          spotifyConfig.redirectUri
        )
      
      case 'apple':
        const appleConfig = this.config.apple
        if (!appleConfig?.email || !appleConfig?.password) {
          throw new Error('Apple Music configuration missing email or password')
        }
        return new AppleMusicIntegration({
          email: appleConfig.email,
          password: appleConfig.password,
          twilioSid: appleConfig.twilioSid,
          twilioToken: appleConfig.twilioToken,
        })
      
      case 'distrokid':
        const distrokidConfig = this.config.distrokid
        if (!distrokidConfig?.email || !distrokidConfig?.password) {
          throw new Error('DistroKid configuration missing email or password')
        }
        return new DistroKidIntegration({
          email: distrokidConfig.email,
          password: distrokidConfig.password,
        })
      
      default:
        return null
    }
  }

  static createSpotify(clientId: string, clientSecret: string, redirectUri?: string): SpotifyIntegration {
    return new SpotifyIntegration(clientId, clientSecret, redirectUri)
  }
}

// Convenience export for creating integrations
export const createIntegration = (platform: PlatformType, config: PlatformConfig): PlatformIntegration | null => {
  const factory = new IntegrationFactory(config)
  return factory.create(platform)
}