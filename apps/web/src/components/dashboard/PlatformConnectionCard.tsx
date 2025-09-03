'use client'

import { useState } from 'react'
import { PlatformType } from '@musicdesk/database'

interface PlatformConnectionCardProps {
  platform: PlatformType
  isConnected: boolean
  artistId: string
  onConnect?: () => void
}

const platformConfig = {
  SPOTIFY: {
    name: 'Spotify',
    color: 'bg-green-500',
    icon: '♫',
    description: 'Connect to Spotify for Artists for streaming analytics',
  },
  APPLE_MUSIC: {
    name: 'Apple Music',
    color: 'bg-gray-800',
    icon: '🍎',
    description: 'Connect to Apple Music for Artists for comprehensive data',
  },
  DISTROKID: {
    name: 'DistroKid',
    color: 'bg-blue-500',
    icon: '🎵',
    description: 'Connect your DistroKid account for earnings data',
  },
} as const

export default function PlatformConnectionCard({
  platform,
  isConnected,
  artistId,
  onConnect,
}: PlatformConnectionCardProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const config = platformConfig[platform]

  const handleConnect = async () => {
    setIsConnecting(true)
    
    try {
      if (platform === 'SPOTIFY') {
        // Get Spotify auth URL
        const response = await fetch(`/api/platforms/spotify/auth?artistId=${artistId}`)
        const data = await response.json()
        
        if (data.success) {
          window.location.href = data.data.authUrl
        }
      } else if (platform === 'APPLE_MUSIC') {
        // Show Apple Music auth modal (would need to implement)
        alert('Apple Music integration requires email and password. Feature coming soon!')
      } else if (platform === 'DISTROKID') {
        alert('DistroKid integration coming soon!')
      }
      
      onConnect?.()
    } catch (error) {
      console.error('Connection failed:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className={`rounded-lg border-2 ${isConnected ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'} p-6`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full ${config.color} flex items-center justify-center text-white text-xl`}>
            {config.icon}
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">
              {config.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {config.description}
            </p>
            
            {isConnected && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">
                  Connected
                </span>
              </div>
            )}
          </div>
        </div>

        <div>
          {isConnected ? (
            <button
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              onClick={() => {
                // Navigate to platform management page
                window.location.href = `/dashboard/artists/${artistId}/platforms/${platform.toLowerCase()}`
              }}
            >
              Manage
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
      </div>

      {isConnected && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">--</div>
              <div className="text-xs text-gray-500">Streams</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">--</div>
              <div className="text-xs text-gray-500">Listeners</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">--</div>
              <div className="text-xs text-gray-500">Followers</div>
            </div>
          </div>
          <div className="text-center mt-2">
            <span className="text-xs text-gray-500">Last updated: --</span>
          </div>
        </div>
      )}
    </div>
  )
}