'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import StreamsChart from '@/components/analytics/StreamsChart'
import PlatformConnectionCard from '@/components/dashboard/PlatformConnectionCard'

interface Artist {
  id: string
  name: string
  verified: boolean
  avatar?: string
  bio?: string
  genres: string[]
  spotifyId?: string
  appleMusicId?: string
  platforms: Array<{
    id: string
    type: 'SPOTIFY' | 'APPLE_MUSIC' | 'DISTROKID'
    status: string
    lastSync?: string
  }>
  tracks: Array<{
    id: string
    title: string
    isrc?: string
    duration?: number
  }>
  releases: Array<{
    id: string
    title: string
    status: string
    releaseDate?: string
  }>
  analytics: Array<{
    date: string
    streams: number
    listeners: number
    source: 'SPOTIFY' | 'APPLE_MUSIC'
  }>
  unclaimedRoyalties: Array<{
    id: string
    amount: number
    source: string
    type: string
  }>
}

export default function ArtistDetailPage() {
  const params = useParams()
  const artistId = params.id as string
  
  const [artist, setArtist] = useState<Artist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'releases' | 'royalties'>('overview')

  useEffect(() => {
    if (artistId) {
      fetchArtist()
    }
  }, [artistId])

  const fetchArtist = async () => {
    try {
      const response = await fetch(`/api/artists/${artistId}`)
      const data = await response.json()
      
      if (data.success) {
        setArtist(data.data)
      } else {
        setError(data.error || 'Artist not found')
      }
    } catch (err) {
      setError('Error loading artist')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading artist details...</p>
        </div>
      </div>
    )
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Artist Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/dashboard/artists"
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            Back to Artists
          </Link>
        </div>
      </div>
    )
  }

  const connectedPlatforms = artist.platforms.filter(p => p.status === 'SYNCED')
  const totalRoyaltyValue = artist.unclaimedRoyalties.reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-2xl font-bold text-gray-900">🎵 MusicDesk</Link>
              <span className="text-gray-400">→</span>
              <Link href="/dashboard/artists" className="text-gray-500 hover:text-gray-700">Artists</Link>
              <span className="text-gray-400">→</span>
              <h1 className="text-lg font-medium text-gray-900">{artist.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              {artist.verified && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  Verified
                </span>
              )}
              <button className="text-gray-500 hover:text-gray-700 p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Artist Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              {artist.avatar ? (
                <img src={artist.avatar} alt={artist.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-white text-2xl font-bold">{artist.name[0]}</span>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{artist.name}</h1>
                {artist.verified && (
                  <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Verified
                  </div>
                )}
              </div>
              
              {artist.bio && (
                <p className="text-gray-600 mb-3">{artist.bio}</p>
              )}
              
              <div className="flex flex-wrap gap-2 mb-4">
                {artist.genres.map((genre) => (
                  <span key={genre} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {genre}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{artist.tracks.length} tracks</span>
                <span>{artist.releases.length} releases</span>
                <span>{connectedPlatforms.length} platform{connectedPlatforms.length !== 1 ? 's' : ''} connected</span>
              </div>
            </div>

            <div className="text-right">
              <Link
                href={`/dashboard/artists/${artist.id}/edit`}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                Edit Artist
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Monthly Listeners</h3>
            <div className="text-2xl font-bold text-gray-900">15.2K</div>
            <div className="text-sm text-green-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              +12.3%
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Streams</h3>
            <div className="text-2xl font-bold text-gray-900">1.8M</div>
            <div className="text-sm text-green-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              +8.7%
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Unclaimed Royalties</h3>
            <div className="text-2xl font-bold text-orange-600">${totalRoyaltyValue.toFixed(2)}</div>
            <div className="text-sm text-orange-600">
              {artist.unclaimedRoyalties.length} claim{artist.unclaimedRoyalties.length !== 1 ? 's' : ''} available
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'analytics', label: 'Analytics' },
                { key: 'releases', label: 'Releases' },
                { key: 'royalties', label: 'Royalties' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === tab.key
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Connections</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <PlatformConnectionCard
                      platform="SPOTIFY"
                      isConnected={!!artist.spotifyId}
                      artistId={artist.id}
                    />
                    <PlatformConnectionCard
                      platform="APPLE_MUSIC"
                      isConnected={!!artist.appleMusicId}
                      artistId={artist.id}
                    />
                    <PlatformConnectionCard
                      platform="DISTROKID"
                      isConnected={artist.platforms.some(p => p.type === 'DISTROKID')}
                      artistId={artist.id}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="text-gray-500 text-center">Recent activity will appear here</p>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div>
                <StreamsChart 
                  data={artist.analytics.map(a => ({
                    date: a.date,
                    streams: a.streams,
                    source: a.source === 'SPOTIFY' ? 'SPOTIFY' : 'APPLE_MUSIC'
                  }))}
                  timeframe="30d"
                />
              </div>
            )}

            {/* Releases Tab */}
            {activeTab === 'releases' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Releases</h3>
                  <Link
                    href={`/dashboard/releases/new?artistId=${artist.id}`}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                  >
                    New Release
                  </Link>
                </div>
                
                {artist.releases.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No releases yet. Create your first release to get started.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {artist.releases.map((release) => (
                      <div key={release.id} className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                          <h4 className="font-medium text-gray-900">{release.title}</h4>
                          <p className="text-sm text-gray-500">{release.status}</p>
                        </div>
                        <Link
                          href={`/dashboard/releases/${release.id}`}
                          className="text-purple-600 hover:text-purple-700 text-sm"
                        >
                          View →
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Royalties Tab */}
            {activeTab === 'royalties' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Unclaimed Royalties ({artist.unclaimedRoyalties.length})
                </h3>
                
                {artist.unclaimedRoyalties.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No unclaimed royalties found. Great job staying on top of your earnings!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {artist.unclaimedRoyalties.map((royalty) => (
                      <div key={royalty.id} className="flex items-center justify-between p-4 border rounded-md bg-orange-50 border-orange-200">
                        <div>
                          <h4 className="font-medium text-gray-900">${royalty.amount.toFixed(2)}</h4>
                          <p className="text-sm text-gray-500">{royalty.source} - {royalty.type}</p>
                        </div>
                        <button className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700">
                          Claim
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}