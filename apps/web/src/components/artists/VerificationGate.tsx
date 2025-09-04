'use client'

import { useState } from 'react'
import ClaimArtistButton from './ClaimArtistButton'

interface VerificationGateProps {
  artist: {
    id: string
    name: string
    avatar?: string
    spotifyId?: string
    appleMusicId?: string
    amiIdentity?: string
    verified: boolean
  }
  userRole?: 'OWNER' | 'MANAGER' | 'CONTRIBUTOR' | 'VIEWER' | null
  onVerified: () => void
}

export default function VerificationGate({ artist, userRole, onVerified }: VerificationGateProps) {
  const [verificationStep, setVerificationStep] = useState<'claim' | 'pending' | 'verified'>('claim')

  // If user already has role, they're verified
  if (userRole) {
    return null // Gate is open
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Artist Info */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center mb-4">
            {artist.avatar ? (
              <img src={artist.avatar} alt={artist.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-white text-2xl font-bold">{artist.name[0]}</span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{artist.name}</h2>
          <p className="text-gray-600">Artist Verification Required</p>
        </div>

        {/* Verification Steps */}
        {verificationStep === 'claim' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="text-blue-600 text-3xl mb-3">🔒</div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Verify Artist Ownership
              </h3>
              <p className="text-blue-800 text-sm mb-4">
                To access this artist's analytics, releases, and management features, 
                you need to prove ownership through platform verification.
              </p>
              
              <div className="text-left">
                <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>We'll send a team invitation to your platform account</li>
                  <li>You accept the invitation in Spotify for Artists or Apple Music</li>
                  <li>We verify you have access to the artist's data</li>
                  <li>You gain full management access to the artist</li>
                </ol>
              </div>
            </div>

            <div>
              <ClaimArtistButton
                artist={artist}
                userRole={userRole}
                onClaimed={() => {
                  setVerificationStep('pending')
                  // Refresh parent component after claiming
                  setTimeout(() => onVerified(), 2000)
                }}
              />
            </div>

            <div className="text-sm text-gray-500">
              <p>Only the actual artist or authorized team members can verify ownership.</p>
              <p className="mt-1">This prevents unauthorized access to artist data.</p>
            </div>
          </div>
        )}

        {verificationStep === 'pending' && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="text-yellow-600 text-3xl mb-3">⏳</div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Verification in Progress
              </h3>
              <p className="text-yellow-800 text-sm mb-4">
                We've sent a team invitation to your email. Check your platform account to accept it.
              </p>
              
              <div className="text-left">
                <h4 className="font-medium text-yellow-900 mb-2">Next steps:</h4>
                <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                  <li>Check your email for the platform invitation</li>
                  <li>Log into your Spotify for Artists or Apple Music account</li>
                  <li>Accept the team invitation from MusicDesk</li>
                  <li>Return here - verification will be automatic</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => {
                // Check verification status
                onVerified()
              }}
              className="bg-yellow-600 text-white px-6 py-3 rounded-md hover:bg-yellow-700"
            >
              I've Accepted the Invitation
            </button>
          </div>
        )}

        {/* Back link */}
        <div className="mt-8 pt-6 border-t">
          <a
            href="/dashboard/artists"
            className="text-purple-600 hover:text-purple-700 text-sm"
          >
            ← Back to Artists
          </a>
        </div>
      </div>
    </div>
  )
}