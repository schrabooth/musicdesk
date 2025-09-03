'use client'

import { useState } from 'react'

interface ClaimArtistButtonProps {
  artist: {
    id: string
    name: string
    spotifyId?: string
    appleMusicId?: string
    amiIdentity?: string
    verified: boolean
  }
  userId?: string
  userRole?: 'OWNER' | 'MANAGER' | 'CONTRIBUTOR' | 'VIEWER' | null
  onClaimed?: () => void
}

export default function ClaimArtistButton({ 
  artist, 
  userId = 'demo-user-id', // In production, get from session
  userRole,
  onClaimed 
}: ClaimArtistButtonProps) {
  const [claiming, setClaiming] = useState(false)
  const [claimStatus, setClaimStatus] = useState<'idle' | 'pending' | 'verified' | 'failed'>('idle')
  const [selectedPlatform, setSelectedPlatform] = useState<'SPOTIFY' | 'APPLE_MUSIC' | null>(null)

  // If user already has a role, show management options
  if (userRole) {
    return (
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          userRole === 'OWNER' ? 'bg-purple-100 text-purple-800' :
          userRole === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {userRole}
        </span>
        <button className="text-purple-600 hover:text-purple-700 text-sm">
          Manage
        </button>
      </div>
    )
  }

  const handleClaim = async (platform: 'SPOTIFY' | 'APPLE_MUSIC') => {
    setClaiming(true)
    setClaimStatus('pending')
    
    try {
      const response = await fetch(`/api/artists/${artist.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          platform,
          claimType: 'ownership',
        }),
      })

      const data = await response.json()

      if (data.success) {
        setClaimStatus('pending')
        onClaimed?.()
        
        // Show next steps to user
        alert(`Verification initiated! Next steps:\n${data.nextSteps?.join('\n')}`)
      } else {
        setClaimStatus('failed')
        alert(`Claim failed: ${data.error}`)
      }
    } catch (error) {
      setClaimStatus('failed')
      console.error('Claim error:', error)
    } finally {
      setClaiming(false)
    }
  }

  // Show platform selection if not selected
  if (!selectedPlatform) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600">Claim this artist through:</p>
        
        <div className="flex gap-2">
          {artist.spotifyId && (
            <button
              onClick={() => setSelectedPlatform('SPOTIFY')}
              className="flex items-center gap-2 px-3 py-2 border border-green-300 rounded-md hover:bg-green-50 text-sm"
            >
              <span className="text-green-600">🎵</span>
              Spotify for Artists
            </button>
          )}
          
          {(artist.appleMusicId || artist.amiIdentity) && (
            <button
              onClick={() => setSelectedPlatform('APPLE_MUSIC')}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            >
              <span>🍎</span>
              Apple Music for Artists
            </button>
          )}
        </div>

        {!artist.spotifyId && !artist.appleMusicId && (
          <p className="text-sm text-red-600">
            No platform IDs available for verification. Search and import artist first.
          </p>
        )}
      </div>
    )
  }

  // Show claim confirmation for selected platform
  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">
          Claim {artist.name} via {selectedPlatform === 'SPOTIFY' ? 'Spotify' : 'Apple Music'}
        </h4>
        
        <p className="text-sm text-blue-800 mb-3">
          {selectedPlatform === 'SPOTIFY' 
            ? 'We\'ll send a team invitation to your Spotify for Artists account. Accept it to verify ownership.'
            : 'We\'ll send a team invitation to your Apple Music for Artists account. Accept it to verify ownership.'
          }
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => handleClaim(selectedPlatform)}
            disabled={claiming}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {claiming ? 'Sending Invitation...' : 'Send Team Invitation'}
          </button>
          
          <button
            onClick={() => setSelectedPlatform(null)}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Back
          </button>
        </div>
      </div>

      {claimStatus === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            ⏳ Verification pending. Check your {selectedPlatform === 'SPOTIFY' ? 'Spotify' : 'Apple Music'} for Artists dashboard for the invitation.
          </p>
        </div>
      )}

      {claimStatus === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">
            ❌ Verification failed. Please try again or contact support.
          </p>
          <button 
            onClick={() => setClaimStatus('idle')}
            className="text-red-600 hover:text-red-700 text-sm mt-1"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}